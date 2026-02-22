import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { mapWithField } from '@/features/utils/mapper/fieldMapper';
import { WATCH_PROGRESS_POLICY } from '@/presentation/components/progress';
import type {
  WatchHistoryDto,
  WatchHistoryWithContentDto,
  WatchHistoryCalendarItemDto,
  CreateWatchHistoryParams,
  UpdateWatchProgressParams,
} from '../types';

const TABLE_NAME = 'watch_history';

/**
 * Supabase join으로 가져온 contents 테이블의 부분 타입
 */
type ContentJoin = { title?: string; poster_path?: string; backdrop_path?: string } | null;

/**
 * 인증된 사용자 정보 반환
 * @returns 미인증 시 null
 */
async function getAuthUser(): Promise<User | null> {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    return null;
  }
  return data.user ?? null;
}

/**
 * 인증된 사용자 정보 반환
 * @throws 미인증 시 에러
 */
async function requireAuth(): Promise<User> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

/**
 * 전체 시청 여부 계산 (YouTube 스타일 정책)
 * 95% 이상 시청 또는 남은 10초 이하면 전체 시청으로 간주
 */
function calculateIsFullyWatched(progressSeconds: number, durationSeconds: number): boolean {
  // Validate durationSeconds
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return false;
  }

  // Sanitize and clamp progressSeconds
  const sanitizedProgress = Number.isFinite(progressSeconds) ? progressSeconds : 0;
  const clampedProgress = Math.max(0, Math.min(sanitizedProgress, durationSeconds));

  const percent = (clampedProgress / durationSeconds) * 100;
  const remainingSeconds = durationSeconds - clampedProgress;

  return (
    percent >= WATCH_PROGRESS_POLICY.COMPLETION_PERCENT ||
    remainingSeconds <= WATCH_PROGRESS_POLICY.COMPLETION_REMAINING_SECONDS
  );
}

/**
 * 시청 기록 API
 */
export const watchHistoryApi = {
  /**
   * 완료된 시청 개수 조회 (is_fully_watched가 true인 고유 콘텐츠 수)
   */
  getFullyWatchedCount: async (): Promise<number> => {
    const user = await getAuthUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_fully_watched', true);

    if (error) {
      console.error('완료된 시청 개수 조회 실패:', error);
      return 0;
    }

    return count ?? 0;
  },

  /**
   * 완료된 시청 목록 조회 (is_fully_watched가 true인 콘텐츠)
   * 콘텐츠 정보 포함
   */
  getFullyWatchedList: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: WatchHistoryWithContentDto[];
    hasMore: boolean;
    totalCount: number;
  }> => {
    const user = await requireAuth();

    // 전체 카운트 조회
    const { count, error: countError } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_fully_watched', true);

    if (countError) {
      console.error('완료된 시청 목록 수 조회 실패:', countError);
      throw new Error(`Failed to count fully watched: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { items: [], hasMore: false, totalCount: 0 };
    }

    // 데이터 조회
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        contents!watch_history_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .eq('is_fully_watched', true)
      .order('last_watched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('완료된 시청 목록 조회 실패:', error);
      throw new Error(`Failed to fetch fully watched: ${error.message}`);
    }

    const items: WatchHistoryWithContentDto[] = (data ?? []).map((item) => {
      const contents = item.contents as ContentJoin;
      return {
        ...mapWithField<WatchHistoryDto>(item),
        contentTitle: contents?.title ?? '',
        contentPosterPath: contents?.poster_path ?? '',
        contentBackdropPath: contents?.backdrop_path ?? '',
        progressSeconds: item.progress_seconds ?? 0,
        durationSeconds: item.duration_seconds ?? 0,
      };
    });

    const hasMore = offset + limit < totalCount;

    return { items, hasMore, totalCount };
  },

  /**
   * 시청 기록 추가 (upsert)
   * user_id + content_id + content_type가 이미 존재하면 업데이트
   */
  addWatchHistory: async (params: CreateWatchHistoryParams): Promise<WatchHistoryDto> => {
    const user = await requireAuth();
    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: user.id,
          content_id: params.contentId,
          content_type: params.contentType,
          video_id: params.videoId,
          last_watched_at: now,
        },
        { onConflict: 'user_id,content_id,content_type' },
      )
      .select()
      .single();

    if (error) {
      console.error('시청 기록 추가 실패:', error);
      throw new Error(`Failed to add watch history: ${error.message}`);
    }

    return mapWithField<WatchHistoryDto>(data);
  },

  /**
   * 월별 캘린더용 시청 기록 조회
   * 날짜별로 그룹핑하여 첫 번째 포스터 이미지와 콘텐츠 수 반환
   * (last_watched_at 기준으로 해당 월에 마지막으로 시청한 콘텐츠들)
   */
  getCalendarHistory: async (
    year: number,
    month: number,
  ): Promise<WatchHistoryCalendarItemDto[]> => {
    const user = await requireAuth();

    // 월의 시작과 끝 날짜 계산
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
    const lastDay = new Date(year, month - 1 + 1, 0).getDate(); // month is 1-12, so convert to 0-11 for Date constructor
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        last_watched_at,
        content_id,
        contents!watch_history_content_fkey (
          poster_path
        )
      `,
      )
      .eq('user_id', user.id)
      .gte('last_watched_at', startDate)
      .lte('last_watched_at', endDate)
      .order('last_watched_at', { ascending: false });

    if (error) {
      console.error('캘린더 시청 기록 조회 실패:', error);
      throw new Error(`Failed to fetch calendar history: ${error.message}`);
    }

    // 날짜별로 그룹핑 (last_watched_at에서 날짜만 추출)
    const groupedByDate = new Map<
      string,
      {
        count: number;
        firstPosterPath: string;
        contentIds: number[];
      }
    >();

    for (const item of data ?? []) {
      if (!item.last_watched_at) continue; // Skip if last_watched_at is null/undefined
      const date = item.last_watched_at.split('T')[0]; // YYYY-MM-DD 추출
      const existing = groupedByDate.get(date);
      const posterPath = (item.contents as { poster_path?: string } | null)?.poster_path ?? '';

      if (existing) {
        existing.count += 1;
        if (!existing.contentIds.includes(item.content_id)) {
          existing.contentIds.push(item.content_id);
        }
      } else {
        groupedByDate.set(date, {
          count: 1,
          firstPosterPath: posterPath,
          contentIds: [item.content_id],
        });
      }
    }

    // Map을 배열로 변환
    return Array.from(groupedByDate.entries()).map(([watchedDate, data]) => ({
      watchedDate,
      count: data.count,
      firstPosterPath: data.firstPosterPath,
      contentIds: data.contentIds,
    }));
  },

  /**
   * 시청 기록 목록 조회 (최신순)
   * 콘텐츠 정보 포함
   */
  getWatchHistoryList: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: WatchHistoryWithContentDto[];
    hasMore: boolean;
    totalCount: number;
  }> => {
    const user = await requireAuth();

    // 전체 카운트 조회
    const { count, error: countError } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('시청 기록 수 조회 실패:', countError);
      throw new Error(`Failed to count watch history: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { items: [], hasMore: false, totalCount: 0 };
    }

    // 데이터 조회
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        contents!watch_history_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('시청 기록 목록 조회 실패:', error);
      throw new Error(`Failed to fetch watch history: ${error.message}`);
    }

    const items: WatchHistoryWithContentDto[] = (data ?? []).map((item) => {
      const contents = item.contents as ContentJoin;
      return {
        ...mapWithField<WatchHistoryDto>(item),
        contentTitle: contents?.title ?? '',
        contentPosterPath: contents?.poster_path ?? '',
        contentBackdropPath: contents?.backdrop_path ?? '',
        progressSeconds: item.progress_seconds ?? 0,
        durationSeconds: item.duration_seconds ?? 0,
      };
    });

    const hasMore = offset + limit < totalCount;

    return { items, hasMore, totalCount };
  },

  /**
   * 고유 콘텐츠 시청 기록 목록 조회 (중복 제거, 최신순)
   * 같은 콘텐츠를 여러 번 시청한 경우 가장 최근 기록만 반환
   */
  getUniqueContentHistory: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: WatchHistoryWithContentDto[];
    hasMore: boolean;
  }> => {
    const user = await requireAuth();

    // RPC가 없으므로 클라이언트에서 처리
    // 충분한 데이터를 가져와서 중복 제거
    const fetchLimit = (offset + limit) * 3; // 여유있게 가져옴

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        contents!watch_history_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .limit(fetchLimit);

    if (error) {
      console.error('고유 콘텐츠 시청 기록 조회 실패:', error);
      throw new Error(`Failed to fetch unique content history: ${error.message}`);
    }

    // 콘텐츠별 중복 제거 (최신 기록만 유지)
    const seenContents = new Set<string>();
    const uniqueItems: WatchHistoryWithContentDto[] = [];

    for (const item of data ?? []) {
      const contentKey = `${item.content_id}-${item.content_type}`;
      if (!seenContents.has(contentKey)) {
        seenContents.add(contentKey);
        const contents = item.contents as ContentJoin;
        uniqueItems.push({
          ...mapWithField<WatchHistoryDto>(item),
          contentTitle: contents?.title ?? '',
          contentPosterPath: contents?.poster_path ?? '',
          contentBackdropPath: contents?.backdrop_path ?? '',
          progressSeconds: item.progress_seconds ?? 0,
          durationSeconds: item.duration_seconds ?? 0,
        });
      }
    }

    // 페이지네이션 적용
    const paginatedItems = uniqueItems.slice(offset, offset + limit);
    const hasMore = uniqueItems.length > offset + limit;

    return { items: paginatedItems, hasMore };
  },

  /**
   * 시청 기록 삭제
   */
  deleteWatchHistory: async (historyId: string): Promise<void> => {
    const user = await requireAuth();

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('id', historyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('시청 기록 삭제 실패:', error);
      throw new Error(`Failed to delete watch history: ${error.message}`);
    }
  },

  /**
   * 전체 시청 기록 삭제
   */
  clearAllWatchHistory: async (): Promise<void> => {
    const user = await requireAuth();

    const { error } = await supabaseClient.from(TABLE_NAME).delete().eq('user_id', user.id);

    if (error) {
      console.error('전체 시청 기록 삭제 실패:', error);
      throw new Error(`Failed to clear watch history: ${error.message}`);
    }
  },

  /**
   * 시청 진행률 업데이트 (upsert)
   * user_id + content_id + content_type 유니크 제약조건 사용
   * - progress_seconds: 항상 현재 위치로 업데이트 (이어보기용)
   * - is_fully_watched: 한번 true면 계속 true 유지 (OR 연산)
   * - last_watched_at: 항상 최신 시간으로 업데이트
   */
  updateWatchProgress: async (params: UpdateWatchProgressParams): Promise<void> => {
    const user = await requireAuth();
    const now = new Date().toISOString();

    // 전체 시청 여부 계산
    const newIsFullyWatched = calculateIsFullyWatched(
      params.progressSeconds,
      params.durationSeconds,
    );

    // 먼저 insert 시도
    const { error: insertError } = await supabaseClient.from(TABLE_NAME).insert({
      user_id: user.id,
      content_id: params.contentId,
      content_type: params.contentType,
      video_id: params.videoId,
      last_watched_at: now,
      progress_seconds: params.progressSeconds,
      duration_seconds: params.durationSeconds,
      is_fully_watched: newIsFullyWatched,
    });

    // insert 성공하면 종료
    if (!insertError) {
      return;
    }

    // unique constraint violation (code 23505)이 아니면 에러 발생
    if (insertError.code !== '23505') {
      console.error('시청 진행률 생성 실패:', insertError);
      throw new Error(`Failed to create watch progress: ${insertError.message}`);
    }

    // 충돌 시 기존 기록 조회 (is_fully_watched OR 연산을 위해)
    const { data: existingRecord, error: selectError } = await supabaseClient
      .from(TABLE_NAME)
      .select('id, is_fully_watched')
      .eq('user_id', user.id)
      .eq('content_id', params.contentId)
      .eq('content_type', params.contentType)
      .maybeSingle();

    if (selectError) {
      console.error('기존 시청 기록 조회 실패:', selectError);
      throw new Error(`Failed to fetch existing watch progress: ${selectError.message}`);
    }

    if (!existingRecord) {
      throw new Error('Expected existing record after conflict, but none found');
    }

    // is_fully_watched OR 연산: 한번 true면 계속 true 유지
    const isFullyWatched = existingRecord.is_fully_watched || newIsFullyWatched;

    // 기존 기록 업데이트
    const { error: updateError } = await supabaseClient
      .from(TABLE_NAME)
      .update({
        video_id: params.videoId,
        progress_seconds: params.progressSeconds,
        duration_seconds: params.durationSeconds,
        last_watched_at: now,
        is_fully_watched: isFullyWatched,
      })
      .eq('id', existingRecord.id);

    if (updateError) {
      console.error('시청 진행률 업데이트 실패:', updateError);
      throw new Error(`Failed to update watch progress: ${updateError.message}`);
    }
  },

  /**
   * 특정 날짜의 시청 기록 조회
   * 캘린더에서 날짜 클릭 시 해당 날짜의 시청 콘텐츠 목록 반환
   */
  getHistoryByDate: async (date: string): Promise<WatchHistoryWithContentDto[]> => {
    const user = await requireAuth();

    // 날짜 범위 설정 (해당 날짜의 00:00:00 ~ 23:59:59)
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        contents!watch_history_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .gte('last_watched_at', startDate)
      .lte('last_watched_at', endDate)
      .order('last_watched_at', { ascending: false });

    if (error) {
      console.error('날짜별 시청 기록 조회 실패:', error);
      throw new Error(`Failed to fetch history by date: ${error.message}`);
    }

    return (data ?? []).map((item) => {
      const contents = item.contents as ContentJoin;
      return {
        ...mapWithField<WatchHistoryDto>(item),
        contentTitle: contents?.title ?? '',
        contentPosterPath: contents?.poster_path ?? '',
        contentBackdropPath: contents?.backdrop_path ?? '',
        progressSeconds: item.progress_seconds ?? 0,
        durationSeconds: item.duration_seconds ?? 0,
      };
    });
  },

  /**
   * 특정 콘텐츠의 시청 진행률 조회
   * 가장 최근 시청 기록의 진행률을 반환
   */
  getContentProgress: async (
    contentId: number,
    contentType: string,
  ): Promise<{
    progressSeconds: number;
    durationSeconds: number;
    videoId: string | null;
  } | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('progress_seconds, duration_seconds, video_id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();

    if (error) {
      console.error('시청 진행률 조회 실패:', {
        contentId,
        contentType,
        error,
      });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      progressSeconds: data.progress_seconds ?? 0,
      durationSeconds: data.duration_seconds ?? 0,
      videoId: data.video_id ?? null,
    };
  },

  /**
   * 영상 완료 처리
   * 영상이 끝까지 재생되어 종료될 때 호출
   * is_fully_watched를 true로 설정하고 progress를 duration으로 업데이트
   */
  markAsFullyWatched: async (
    contentId: number,
    contentType: string,
    durationSeconds: number,
    videoId?: string | null,
  ): Promise<void> => {
    const user = await requireAuth();

    // Guard: invalid duration
    if (durationSeconds <= 0) {
      return;
    }

    const { error } = await supabaseClient.from(TABLE_NAME).upsert(
      {
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        is_fully_watched: true,
        progress_seconds: durationSeconds,
        duration_seconds: durationSeconds,
        last_watched_at: new Date().toISOString(),
        video_id: videoId ?? null,
      },
      { onConflict: 'user_id,content_id,content_type' },
    );

    if (error) {
      console.error('영상 완료 처리 실패:', error);
      throw new Error(`Failed to mark as fully watched: ${error.message}`);
    }
  },
};
