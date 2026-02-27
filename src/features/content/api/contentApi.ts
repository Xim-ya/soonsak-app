import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { mapWithField } from '@/features/utils/mapper/fieldMapper';
import {
  ContentDto,
  ContentWithVideoDto,
  VideoDto,
  VideoWithContentDto,
  ContentCollectionDto,
  ContentCollectionWithContentsDto,
  ContentIdItem,
} from '../types';
import { CONTENT_DATABASE } from '../../utils/constants/dbConfig';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import type { CurationVideoModel } from '@/presentation/pages/explore/_types/exploreTypes';

/** excludeIds 최대 허용 수 */
const MAX_EXCLUDE_IDS = 1000;

/** 조회수/재생수 RPC 호출 쓰로틀 (콘텐츠별 최소 간격) */
const RPC_THROTTLE_MS = 5000;
const rpcThrottleMap = new Map<string, number>();

/** 트렌딩 RPC 결과 행 타입 (out_ 접두사 컬럼명) */
type RpcTrendingRow = {
  out_id: number;
  out_content_type: string;
  out_title: string;
  out_poster_path: string | null;
  out_backdrop_path: string | null;
  out_title_logo: string | null;
  out_title_logo_lang: string | null;
  out_trending_score: number;
};

/** 유효한 ContentType 값인지 검증 */
function isValidContentType(value: string): value is ContentType {
  return value === 'movie' || value === 'tv';
}

/** 유효한 title logo 언어 값인지 검증 */
function isValidTitleLogoLang(value: string): value is 'ko' | 'en' {
  return value === 'ko' || value === 'en';
}

/** RPC 트렌딩 결과를 ContentDto 배열로 변환 */
function mapTrendingRowsToContentDtos(rows: RpcTrendingRow[]): ContentDto[] {
  return rows
    .filter((row) => isValidContentType(row.out_content_type))
    .map((row): ContentDto => {
      const titleLogoLang =
        row.out_title_logo_lang && isValidTitleLogoLang(row.out_title_logo_lang)
          ? row.out_title_logo_lang
          : undefined;

      return {
        id: row.out_id,
        contentType: row.out_content_type as ContentType,
        title: row.out_title,
        ...(row.out_poster_path && { posterPath: row.out_poster_path }),
        ...(row.out_backdrop_path && { backdropPath: row.out_backdrop_path }),
        ...(row.out_title_logo && { titleLogo: row.out_title_logo }),
        ...(titleLogoLang && { titleLogoLang }),
      };
    });
}

/** 쓰로틀 체크: 최근 호출 이후 충분한 시간이 지났는지 확인 */
function shouldThrottleRpc(key: string): boolean {
  const now = Date.now();
  const lastCall = rpcThrottleMap.get(key);
  if (lastCall !== undefined && now - lastCall < RPC_THROTTLE_MS) {
    return true;
  }
  rpcThrottleMap.set(key, now);
  return false;
}

/** excludeIds 유효성 검증 및 제한 */
function sanitizeExcludeIds(excludeIds: number[]): number[] {
  return excludeIds.filter((id) => Number.isInteger(id) && id > 0).slice(0, MAX_EXCLUDE_IDS);
}

/**
 * 사용자의 시청 기록에서 콘텐츠 ID 목록을 조회
 * @returns 시청한 콘텐츠 ID 배열 또는 null (비로그인/조회실패/빈 결과)
 */
async function getUserWatchedContentIds(): Promise<number[] | null> {
  const { data: userData } = await supabaseClient.auth.getUser();
  if (!userData?.user?.id) {
    return null;
  }

  const { data: watchedRows, error: watchedError } = await supabaseClient
    .from('watch_history')
    .select('content_id')
    .eq('user_id', userData.user.id);

  if (watchedError) {
    console.error('시청 기록 콘텐츠 ID 조회 실패:', watchedError);
    return null;
  }

  if (!watchedRows || watchedRows.length === 0) {
    return null;
  }

  const rawIds = [...new Set(watchedRows.map((w: { content_id: number }) => w.content_id))];
  const sanitizedIds = sanitizeExcludeIds(rawIds);

  return sanitizedIds.length > 0 ? sanitizedIds : null;
}

/** Supabase 쿼리 필터 메서드 인터페이스 */
interface FilterableQuery {
  in(column: string, values: readonly (number | string)[]): this;
  eq(column: string, value: unknown): this;
  overlaps(column: string, values: readonly (number | string)[]): this;
  gte(column: string, value: string | number): this;
  lte(column: string, value: string | number): this;
  not(column: string, operator: string, value: string): this;
}

/** 콘텐츠 필터 조건을 Supabase 쿼리에 적용 (count/data 쿼리 공용) */
function applyContentFilters<T extends FilterableQuery>(
  query: T,
  filter: ContentFilter,
  excludeIds: number[] | null,
  channelContentIds: number[] | null,
): T {
  let q = query;
  if (channelContentIds !== null) {
    q = q.in('id', channelContentIds);
  }
  if (filter.contentType) {
    q = q.eq('content_type', filter.contentType);
  }
  if (filter.genreIds.length > 0) {
    q = q.overlaps('genre_ids', filter.genreIds);
  }
  if (filter.countryCodes.length > 0) {
    q = q.overlaps('origin_country', filter.countryCodes);
  }
  if (filter.releaseYearRange) {
    q = q
      .gte('release_date', `${filter.releaseYearRange.min}-01-01`)
      .lte('release_date', `${filter.releaseYearRange.max}-12-31`);
  }
  if (filter.minStarRating !== null) {
    q = q.gte('vote_average', filter.minStarRating * 2);
  }
  if (excludeIds !== null && excludeIds.length > 0) {
    const safeIds = sanitizeExcludeIds(excludeIds);
    if (safeIds.length > 0) {
      q = q.not('id', 'in', `(${safeIds.join(',')})`);
    }
  }
  return q;
}

export const contentApi = {
  /**
   * 최근 업로드된 콘텐츠 조회 (페이지네이션 지원)
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수 (기본값: 12)
   */
  getRecentUploadedContents: async (
    page: number = 0,
    pageSize: number = 12,
  ): Promise<{ contents: ContentDto[]; hasMore: boolean; totalCount: number }> => {
    const offset = page * pageSize;

    // 카운트와 데이터를 병렬로 조회 (성능 최적화)
    const [countResult, dataResult] = await Promise.all([
      supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        .select('*', { count: 'exact', head: true }),
      supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        .select('*')
        .order(CONTENT_DATABASE.COLUMNS.UPLOADED_AT, { ascending: false })
        .range(offset, offset + pageSize - 1),
    ]);

    if (countResult.error) {
      console.error('콘텐츠 수 조회 실패:', countResult.error);
      throw new Error(`Failed to count contents: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      console.error('콘텐츠 조회 실패:', dataResult.error);
      throw new Error(`Failed to fetch contents: ${dataResult.error.message}`);
    }

    const totalCount = countResult.count ?? 0;
    const contents: ContentDto[] = mapWithField<ContentDto[]>(dataResult.data ?? []);
    const hasMore = (page + 1) * pageSize < totalCount;

    return { contents, hasMore, totalCount };
  },

  /**
   * 특정 콘텐츠의 비디오 목록 조회
   * 정렬 순서: 1) includes_ending=true 우선, 2) runtime 긴 순서
   */
  getVideosByContent: async (contentId: number, contentType: ContentType): Promise<VideoDto[]> => {
    const { data, error } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('includes_ending', { ascending: false })
      .order('runtime', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('비디오 조회 실패:', error);
      throw new Error(`Failed to fetch videos: ${error.message}`);
    }

    const videos: VideoDto[] = mapWithField<VideoDto[]>(data ?? []);

    return videos ?? [];
  },

  /**
   * 한글 초성 검색 지원 콘텐츠 검색
   * - 공백 무시: "그 을" → "그을린 사랑" 매칭
   * - 초성 검색: "ㄱㅇㄹ ㅅㄹ" → "그을린 사랑" 매칭
   * @param query 검색어
   * @param limit 결과 제한 (기본값: 50)
   * @returns 검색 결과 ContentDto 배열
   */
  searchContentsKorean: async (query: string, limit: number = 50): Promise<ContentDto[]> => {
    if (!query.trim()) return [];

    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.SEARCH_CONTENTS_KOREAN, {
      search_query: query,
      result_limit: limit,
    });

    if (error) {
      console.error('한글 검색 실패:', error);
      throw new Error(`Failed to search contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * TMDB ID 목록으로 Supabase에 등록된 콘텐츠만 필터링하여 조회
   * includes_ending = true인 영상이 있는 콘텐츠만 반환
   * @param tmdbIds TMDB 콘텐츠 ID 목록
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @returns ContentDto 배열
   */
  getRegisteredContentsByTmdbIds: async (
    tmdbIds: number[],
    contentType: ContentType,
  ): Promise<ContentDto[]> => {
    if (tmdbIds.length === 0) return [];

    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_REGISTERED_CONTENTS_WITH_ENDING,
      {
        p_ids: tmdbIds,
        p_content_type: contentType,
      },
    );

    if (error) {
      console.error('등록된 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch registered contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * 콘텐츠 조회수 증가 (상세 페이지 진입 시)
   * 동일 콘텐츠에 대해 5초 이내 중복 호출 방지
   */
  incrementViewCount: async (contentId: number, contentType: ContentType): Promise<void> => {
    if (shouldThrottleRpc(`view:${contentId}:${contentType}`)) return;

    const { error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.INCREMENT_VIEW_COUNT, {
      p_content_id: contentId,
      p_content_type: contentType,
    });

    if (error) {
      console.error('조회수 증가 실패:', error);
      // 조회수 증가 실패는 사용자 경험에 영향을 주지 않으므로 throw하지 않음
    }
  },

  /**
   * 콘텐츠 재생수 증가 (영상 재생 시)
   * 동일 콘텐츠에 대해 5초 이내 중복 호출 방지
   */
  incrementPlayCount: async (contentId: number, contentType: ContentType): Promise<void> => {
    if (shouldThrottleRpc(`play:${contentId}:${contentType}`)) return;

    const { error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.INCREMENT_PLAY_COUNT, {
      p_content_id: contentId,
      p_content_type: contentType,
    });

    if (error) {
      console.error('재생수 증가 실패:', error);
      // 재생수 증가 실패는 사용자 경험에 영향을 주지 않으므로 throw하지 않음
    }
  },

  /**
   * 실시간 Top 콘텐츠 조회 (점수 기반)
   * 가중치: play_count × 2 + view_count × 1
   * @param limit 조회할 콘텐츠 수
   * @returns ContentDto 배열
   */
  getTopContentsByEngagement: async (limit: number = 20): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_TOP_CONTENTS_BY_SCORE,
      {
        p_limit: limit,
      },
    );

    if (error) {
      console.error('인기 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch top contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * RPC 함수를 사용하여 content_id 기준 중복 제거 및 페이징 처리
   * 우선순위: is_primary > includes_ending > runtime
   * @param channelId YouTube 채널 ID
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수
   */
  getDistinctContentsByChannel: async (
    channelId: string,
    page: number = 0,
    pageSize: number = 20,
  ): Promise<{ videos: VideoWithContentDto[]; hasMore: boolean; totalCount: number }> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_DISTINCT_CONTENTS_BY_CHANNEL,
      {
        p_channel_id: channelId,
        p_page: page,
        p_page_size: pageSize,
      },
    );

    if (error) {
      console.error('채널 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch channel contents: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { videos: [], hasMore: false, totalCount: 0 };
    }

    // RPC 결과를 VideoWithContentDto로 변환
    const totalCount = Number(data[0]?.total_count ?? 0);
    const videos: VideoWithContentDto[] = data.map(
      (item: {
        id: string;
        content_id: number;
        content_type: string;
        title: string;
        runtime: number | null;
        thumbnail_url: string | null;
        is_primary: boolean;
        channel_id: string;
        includes_ending: boolean;
        uploaded_at: string;
        updated_at: string;
        content_title: string;
        content_poster_path: string;
      }) => ({
        id: item.id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        title: item.title,
        runtime: item.runtime ?? undefined,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        isPrimary: item.is_primary,
        channelId: item.channel_id,
        includesEnding: item.includes_ending,
        uploadedAt: item.uploaded_at,
        updatedAt: item.updated_at,
        contentTitle: item.content_title,
        contentPosterPath: item.content_poster_path,
      }),
    );

    const hasMore = (page + 1) * pageSize < totalCount;

    return { videos, hasMore, totalCount };
  },

  /**
   * 장르 기반 콘텐츠 조회
   * 특정 장르에 해당하고 includes_ending = true인 영상이 있는 콘텐츠만 반환
   * @param genreIds 장르 ID 배열
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param excludeIds 제외할 콘텐츠 ID 배열
   * @param limit 최대 조회 수 (기본값: 18)
   * @returns ContentDto 배열
   */
  getContentsByGenre: async (
    genreIds: number[],
    contentType: ContentType,
    excludeIds: number[],
    limit: number = 18,
  ): Promise<ContentDto[]> => {
    if (genreIds.length === 0) return [];

    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CONTENTS_BY_GENRE, {
      p_genre_ids: genreIds,
      p_content_type: contentType,
      p_exclude_ids: excludeIds,
      p_limit: limit,
    });

    if (error) {
      console.error('장르 기반 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch contents by genre: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * 러닝타임이 긴 콘텐츠 조회
   * isPrimary 비디오 중 런타임이 긴 12개를 engagement ratio 기반으로 정렬
   */
  getLongRuntimeContents: async (): Promise<ContentWithVideoDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_LONG_RUNTIME_CONTENTS,
    );

    if (error) {
      console.error('러닝타임 긴 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch long runtime contents: ${error.message}`);
    }

    return mapWithField<ContentWithVideoDto[]>(data ?? []);
  },

  /**
   * 랜덤 콘텐츠 조회 (빠른탐색 그리드용)
   * 이미 로드된 ID를 제외하고 랜덤하게 콘텐츠를 가져옴
   * @param excludeIds 제외할 콘텐츠 ID 배열
   * @param limit 조회할 콘텐츠 수 (기본값: 20)
   */
  getRandomContents: async (
    excludeIds: number[] = [],
    limit: number = 20,
  ): Promise<ContentDto[]> => {
    // 전체 콘텐츠 수 조회
    const { count, error: countError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('콘텐츠 수 조회 실패:', countError);
      throw new Error(`Failed to count contents: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) return [];

    // 랜덤 offset 계산 (제외 ID 수를 고려)
    const availableCount = Math.max(0, totalCount - excludeIds.length);
    if (availableCount === 0) return [];

    const maxOffset = Math.max(0, availableCount - limit);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    // 제외 ID를 필터링하고 랜덤 offset으로 조회
    let query = supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*')
      .range(randomOffset, randomOffset + limit - 1);

    // 제외할 ID가 있으면 필터 적용 (유효성 검증 포함)
    if (excludeIds.length > 0) {
      const safeIds = excludeIds
        .filter((id) => Number.isInteger(id) && id > 0)
        .slice(0, MAX_EXCLUDE_IDS);
      if (safeIds.length > 0) {
        query = query.not('id', 'in', `(${safeIds.join(',')})`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('랜덤 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch random contents: ${error.message}`);
    }

    // 결과를 섞어서 더 랜덤하게
    const contents = mapWithField<ContentDto[]>(data ?? []);
    return contents.sort(() => Math.random() - 0.5);
  },

  /**
   * 필터 조건에 맞는 랜덤 콘텐츠 조회 (빠른탐색 그리드 필터용)
   * 기존 getRandomContents를 확장하여 장르, 국가, 연도, 평점 필터를 지원
   * @param filter 콘텐츠 필터 조건
   * @param excludeIds 제외할 콘텐츠 ID 배열
   * @param limit 조회할 콘텐츠 수 (기본값: 20)
   */
  getFilteredRandomContents: async (
    filter: ContentFilter,
    excludeIds: number[] = [],
    limit: number = 20,
  ): Promise<ContentDto[]> => {
    // 채널 필터가 있으면 먼저 해당 채널의 content_id 목록을 조회 (2단계 쿼리)
    let channelContentIds: number[] | null = null;
    if (filter.channelIds.length > 0) {
      const { data: videoRows, error: videoError } = await supabaseClient
        .from('videos')
        .select('content_id')
        .in('channel_id', filter.channelIds);

      if (videoError) {
        console.error('채널 콘텐츠 ID 조회 실패:', videoError);
        throw new Error(`Failed to fetch channel content ids: ${videoError.message}`);
      }

      channelContentIds = [
        ...new Set(
          (videoRows ?? [])
            .map((v: { content_id: number | null }) => v.content_id)
            .filter((id): id is number => id !== null),
        ),
      ];
      if (channelContentIds.length === 0) return [];
    }

    // 전체 카운트 조회 (공통 필터 헬퍼 사용)
    const countQuery = applyContentFilters(
      supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*', { count: 'exact', head: true }) as any,
      filter,
      excludeIds,
      channelContentIds,
    );

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('필터 콘텐츠 수 조회 실패:', countError);
      throw new Error(`Failed to count filtered contents: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) return [];

    // 랜덤 offset 계산
    const maxOffset = Math.max(0, totalCount - limit);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    // 동일한 필터로 데이터 조회 (공통 필터 헬퍼 사용)
    const query = applyContentFilters(
      supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        .select('*')
        .range(randomOffset, randomOffset + limit - 1),
      filter,
      excludeIds,
      channelContentIds,
    );

    const { data, error } = await query;

    if (error) {
      console.error('필터 랜덤 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch filtered random contents: ${error.message}`);
    }

    const contents = mapWithField<ContentDto[]>(data ?? []);
    return contents.sort(() => Math.random() - 0.5);
  },

  /**
   * 전체 콘텐츠 수 조회
   */
  getTotalContentCount: async (): Promise<number> => {
    const { count, error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('콘텐츠 수 조회 실패:', error);
      throw new Error(`Failed to count contents: ${error.message}`);
    }

    return count ?? 0;
  },

  /**
   * 콘텐츠 컬렉션 목록 조회 (RPC 사용)
   * 활성 컬렉션 + 최근 비활성 컬렉션 3개를 포함하여 총 8개 반환
   * contents 정보가 이미 포함되어 있음
   */
  getContentCollections: async (): Promise<ContentCollectionWithContentsDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CONTENT_COLLECTIONS);

    if (error) {
      console.error('콘텐츠 컬렉션 조회 실패:', error);
      throw new Error(`Failed to fetch content collections: ${error.message}`);
    }

    // RPC 결과 타입 정의
    type RpcCollectionRow = {
      id: string;
      title: string;
      subtitle: string | null;
      theme_keywords: string[] | null;
      display_order: number;
      is_active: boolean;
      generated_at: string;
      contents: unknown[];
    };

    return (data ?? []).map(
      (row: RpcCollectionRow): ContentCollectionWithContentsDto => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle ?? undefined,
        themeKeywords: row.theme_keywords ?? undefined,
        displayOrder: row.display_order,
        isActive: row.is_active,
        contents: mapWithField<ContentDto[]>(row.contents),
      }),
    );
  },

  /**
   * 타입별 콘텐츠 일괄 조회
   * @param ids 조회할 콘텐츠 ID 목록
   * @param contentType 콘텐츠 타입
   */
  getContentsByTypeAndIds: async (
    ids: number[],
    contentType: ContentType,
  ): Promise<ContentDto[]> => {
    if (ids.length === 0) return [];

    const { data, error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*')
      .in('id', ids)
      .eq('content_type', contentType);

    if (error) {
      console.error(`콘텐츠 조회 실패 (${contentType}):`, error);
      throw new Error(`Failed to fetch ${contentType} contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * 컬렉션에 포함된 콘텐츠 상세 정보 조회
   * content_ids 배열을 기반으로 contents 테이블에서 movie/tv 병렬 조회
   * @param contentIds 컬렉션의 콘텐츠 ID 목록
   * @returns 콘텐츠 상세 정보 배열
   */
  getContentsByCollectionIds: async (contentIds: ContentIdItem[]): Promise<ContentDto[]> => {
    if (contentIds.length === 0) return [];

    const movieIds = contentIds.filter((item) => item.type === 'movie').map((item) => item.id);
    const tvIds = contentIds.filter((item) => item.type === 'tv').map((item) => item.id);

    const [movies, tvShows] = await Promise.all([
      contentApi.getContentsByTypeAndIds(movieIds, 'movie'),
      contentApi.getContentsByTypeAndIds(tvIds, 'tv'),
    ]);

    return [...movies, ...tvShows];
  },

  /**
   * 컬렉션과 연결된 콘텐츠 상세 정보를 포함하여 조회
   * content_ids 순서를 유지하며, 중복 ID는 첫 번째만 포함
   */
  getCollectionWithContents: async (
    collection: ContentCollectionDto,
  ): Promise<ContentCollectionWithContentsDto> => {
    const contents = await contentApi.getContentsByCollectionIds(collection.contentIds);

    // 조회된 콘텐츠를 키 기반 맵으로 구성
    const contentMap = new Map<string, ContentDto>();
    contents.forEach((content) => {
      contentMap.set(`${content.id}-${content.contentType}`, content);
    });

    // contentIds 순서 유지 + 중복 제거
    const seenKeys = new Set<string>();
    const orderedContents: ContentDto[] = [];

    collection.contentIds.forEach((item) => {
      const key = `${item.id}-${item.type}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const content = contentMap.get(key);
        if (content) {
          orderedContents.push(content);
        }
      }
    });

    const result: ContentCollectionWithContentsDto = {
      id: collection.id,
      title: collection.title,
      subtitle: collection.subtitle,
      themeKeywords: collection.themeKeywords,
      displayOrder: collection.displayOrder,
      isActive: collection.isActive,
      contents: orderedContents,
    };

    return result;
  },

  /**
   * 탐색 화면용 콘텐츠 조회 (정렬 + 필터 + 페이징)
   * @param sortType 정렬 타입 (all: 세션 랜덤, latest: uploaded_at DESC, popular: popularity DESC)
   * @param filter 콘텐츠 필터 조건
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수
   * @param sessionSeed 세션별 랜덤 시드 (all 정렬에서 사용, 0~1 사이 값)
   */
  getExploreContents: async (
    sortType: 'all' | 'latest' | 'popular',
    filter: ContentFilter,
    page: number = 0,
    pageSize: number = 20,
    sessionSeed?: number,
  ): Promise<{ contents: ContentDto[]; hasMore: boolean; totalCount: number }> => {
    // 채널 필터가 있으면 먼저 해당 채널의 content_id 목록을 조회
    let channelContentIds: number[] | null = null;
    if (filter.channelIds.length > 0) {
      const { data: videoRows, error: videoError } = await supabaseClient
        .from('videos')
        .select('content_id')
        .in('channel_id', filter.channelIds);

      if (videoError) {
        console.error('채널 콘텐츠 ID 조회 실패:', videoError);
        throw new Error(`Failed to fetch channel content ids: ${videoError.message}`);
      }

      channelContentIds = [
        ...new Set(
          (videoRows ?? [])
            .map((v: { content_id: number | null }) => v.content_id)
            .filter((id): id is number => id !== null),
        ),
      ];
      if (channelContentIds.length === 0) {
        return { contents: [], hasMore: false, totalCount: 0 };
      }
    }

    // includeEnding 필터: 결말 포함 비디오가 있는 콘텐츠 ID만 조회
    let endingContentIds: number[] | null = null;
    if (filter.includeEnding) {
      const { data: endingRows, error: endingError } = await supabaseClient
        .from('videos')
        .select('content_id')
        .eq('includes_ending', true);

      if (endingError) {
        console.error('결말 포함 콘텐츠 ID 조회 실패:', endingError);
        throw new Error(`Failed to fetch ending content ids: ${endingError.message}`);
      }

      endingContentIds = [
        ...new Set(
          (endingRows ?? [])
            .map((v: { content_id: number | null }) => v.content_id)
            .filter((id): id is number => id !== null),
        ),
      ];
      if (endingContentIds.length === 0) {
        return { contents: [], hasMore: false, totalCount: 0 };
      }
    }

    // excludeWatched 필터: 시청 기록이 있는 콘텐츠 ID 조회 (제외용)
    const excludeContentIds = filter.excludeWatched ? await getUserWatchedContentIds() : null;

    const offset = page * pageSize;

    // 'all' 정렬: 세션 시드 기반 랜덤 (RPC 함수 사용)
    if (sortType === 'all' && sessionSeed !== undefined) {
      const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
        'get_seeded_random_contents',
        {
          p_seed: sessionSeed,
          p_limit: pageSize,
          p_offset: offset,
          p_content_type: filter.contentType,
          p_genre_ids: filter.genreIds.length > 0 ? filter.genreIds : null,
          p_origin_countries: filter.countryCodes.length > 0 ? filter.countryCodes : null,
          p_min_year: filter.releaseYearRange?.min ?? null,
          p_max_year: filter.releaseYearRange?.max ?? null,
          p_min_rating: filter.minStarRating,
          p_include_ending: filter.includeEnding,
          p_channel_content_ids: channelContentIds,
          p_ending_content_ids: endingContentIds,
          p_exclude_content_ids: excludeContentIds,
        },
      );

      if (rpcError) {
        console.error('시드 랜덤 콘텐츠 조회 실패:', rpcError);
        throw new Error(`Failed to fetch seeded random contents: ${rpcError.message}`);
      }

      const rows = rpcData ?? [];
      const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const contents = mapWithField<ContentDto[]>(
        rows.map((r: { content_row: unknown }) => r.content_row),
      );
      const hasMore = (page + 1) * pageSize < totalCount;

      return { contents, hasMore, totalCount };
    }

    // 'popular' 정렬: 복합 점수 기반 (RPC 함수 사용)
    if (sortType === 'popular') {
      const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
        CONTENT_DATABASE.RPC.GET_EXPLORE_CONTENTS_BY_TRENDING_SCORE,
        {
          p_content_type: filter.contentType,
          p_genre_ids: filter.genreIds.length > 0 ? filter.genreIds : null,
          p_origin_countries: filter.countryCodes.length > 0 ? filter.countryCodes : null,
          p_min_year: filter.releaseYearRange?.min ?? null,
          p_max_year: filter.releaseYearRange?.max ?? null,
          p_min_rating: filter.minStarRating,
          p_include_ending: filter.includeEnding,
          p_channel_content_ids: channelContentIds,
          p_ending_content_ids: endingContentIds,
          p_exclude_content_ids: excludeContentIds,
          p_limit: pageSize,
          p_offset: offset,
        },
      );

      if (rpcError) {
        console.error('인기순 콘텐츠 조회 실패:', rpcError);
        throw new Error(`Failed to fetch popular contents: ${rpcError.message}`);
      }

      const rows = rpcData ?? [];
      const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const contents = mapWithField<ContentDto[]>(
        rows.map((r: { content_row: unknown }) => r.content_row),
      );
      const hasMore = (page + 1) * pageSize < totalCount;

      return { contents, hasMore, totalCount };
    }

    // 'all' 또는 'latest' 정렬: sortType에 따라 정렬 컬럼 결정
    // - 'all': id 기준 내림차순 (기본값)
    // - 'latest': uploaded_at 기준 내림차순
    const sortConfig = {
      all: { column: 'id', ascending: false },
      latest: { column: CONTENT_DATABASE.COLUMNS.UPLOADED_AT, ascending: false },
    }[sortType] ?? { column: 'id', ascending: false };

    // 카운트 쿼리
    let countQuery = supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*', { count: 'exact', head: true });

    countQuery = applyContentFilters(countQuery, filter, excludeContentIds, channelContentIds);

    if (endingContentIds !== null) {
      countQuery = countQuery.in('id', endingContentIds);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('탐색 콘텐츠 수 조회 실패:', countError);
      throw new Error(`Failed to count explore contents: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { contents: [], hasMore: false, totalCount: 0 };
    }

    // 데이터 조회 쿼리
    let query = supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*')
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .range(offset, offset + pageSize - 1);

    query = applyContentFilters(query, filter, excludeContentIds, channelContentIds);

    if (endingContentIds !== null) {
      query = query.in('id', endingContentIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('탐색 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch explore contents: ${error.message}`);
    }

    const contents = mapWithField<ContentDto[]>(data ?? []);
    const hasMore = (page + 1) * pageSize < totalCount;

    return { contents, hasMore, totalCount };
  },

  /**
   * 큐레이션 캐러셀용 랜덤 대표 비디오 조회
   * 콘텐츠별 대표 비디오 1개를 랜덤하게 선정하여 반환
   * @param limit 조회할 비디오 수 (기본값: 10)
   */
  getCurationVideos: async (limit: number = 10): Promise<CurationVideoModel[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RANDOM_CURATION_VIDEOS,
      { p_limit: limit },
    );

    if (error) {
      console.error('큐레이션 비디오 조회 실패:', error);
      throw new Error(`Failed to fetch curation videos: ${error.message}`);
    }

    // RPC 결과 타입 정의
    type RpcCurationVideo = {
      video_id: string;
      content_id: number;
      content_type: string;
      video_title: string;
      content_title: string;
      thumbnail_url: string | null;
      runtime: number | null;
      channel_id: string | null;
      channel_name: string | null;
      channel_logo_url: string | null;
      poster_path: string | null;
      backdrop_path: string | null;
      release_date: string | null;
      genre_ids: number[] | null;
    };

    // backdrop_path가 null인 항목 필터링 후 CurationVideoModel로 변환
    return (data ?? [])
      .filter((item: RpcCurationVideo) => item.backdrop_path != null)
      .map((item: RpcCurationVideo) => ({
        videoId: item.video_id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        videoTitle: item.video_title,
        contentTitle: item.content_title,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        runtime: item.runtime ?? undefined,
        channelId: item.channel_id ?? undefined,
        channelName: item.channel_name ?? undefined,
        channelLogoUrl: item.channel_logo_url ?? undefined,
        posterPath: item.poster_path ?? undefined,
        backdropPath: item.backdrop_path as string,
        releaseDate: item.release_date ?? undefined,
        genreIds: item.genre_ids ?? undefined,
      }));
  },

  /**
   * 이번주 뜨는 콘텐츠 조회 (복합 점수 기반)
   * 가중치: 시청완료(100) > 찜(80) > TMDB평점(60) > 앱내평점(60) > YT조회수(35) > YT좋아요비율(30) > TMDB인기도(10)
   * @param limit 조회할 콘텐츠 수 (기본값: 15)
   * @returns 트렌딩 콘텐츠 배열
   */
  getTrendingContents: async (limit: number = 15): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_TRENDING_CONTENTS, {
      p_limit: limit,
    });

    if (error) {
      console.error('트렌딩 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch trending contents: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 순삭 TOP 10 조회 (홈 화면용)
   * 조건: 대표 비디오가 결말 포함(includes_ending=true)인 콘텐츠만
   * 가중치: YT좋아요비율(100) > YT조회수(80) > 시청완료(60) > 찜(50) > TMDB평점(40) > 앱내평점(40) > TMDB인기도(10)
   * @param limit 조회할 콘텐츠 수 (기본값: 10)
   * @returns 트렌딩 콘텐츠 배열
   */
  getSoonsakTopTen: async (limit: number = 10): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_SOONSAK_TOP_TEN, {
      p_limit: limit,
    });

    if (error) {
      console.error('순삭 TOP 10 조회 실패:', error);
      throw new Error(`Failed to fetch soonsak top ten: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 최근 업로드된 콘텐츠 중 트렌딩 조회 (검색 화면용)
   * 최근 2주 내 업로드된 콘텐츠만 대상으로 복합 점수 계산
   * @param limit 조회할 콘텐츠 수 (기본값: 15)
   * @param days 업로드 기준 일수 (기본값: 14)
   * @returns 트렌딩 콘텐츠 배열
   */
  getRecentTrendingContents: async (
    limit: number = 15,
    days: number = 14,
  ): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RECENT_TRENDING_CONTENTS,
      {
        p_limit: limit,
        p_days: days,
      },
    );

    if (error) {
      console.error('최근 트렌딩 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch recent trending contents: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 홈 배너용 랜덤 콘텐츠 조회
   * 조건: backdrop_path/tagline 필수, 대표영상 결말포함, 평점 6.0+, 좋아요비율 0.4%+
   * 정렬: 조회수 가중치 랜덤 (조회수 높을수록 선택 확률 증가)
   * @param limit 조회할 콘텐츠 수 (기본값: 5, 최대: 20)
   * @returns ContentDto 배열 (빈 배열 가능)
   */
  getRandomBannerContents: async (limit: number = 5): Promise<ContentDto[]> => {
    // 유효한 limit 값으로 정규화 (1~20 범위)
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);

    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RANDOM_BANNER_CONTENTS,
      { p_limit: safeLimit },
    );

    if (error) {
      console.error('배너 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch banner contents: ${error.message}`);
    }

    // 빈 결과 처리: RPC가 null 또는 빈 배열 반환 시 빈 배열 반환
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return mapWithField<ContentDto[]>(data);
  },

  /**
   * 채널 페이지용 비디오 조회
   * 채널별 비디오 목록을 콘텐츠/채널 정보와 함께 반환
   * @param channelIds 조회할 채널 ID 배열 (null이면 전체)
   * @param sortType 정렬 타입 (latest: 최신순, popular: 인기순, random: 랜덤)
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수
   * @param seed 랜덤 정렬용 시드 값
   * @param includeEnding 결말 포함 비디오만 필터링 여부
   * @param excludeWatched 시청한 콘텐츠 제외 여부
   * @param contentType 콘텐츠 타입 필터 (movie/tv)
   * @param genreIds 장르 ID 배열 필터
   * @param countryCodes 국가 코드 배열 필터
   * @param releaseYearRange 공개연도 범위 필터
   * @param minStarRating 최소 평점 필터 (1~5 스케일)
   */
  getChannelVideos: async (
    channelIds: string[] | null = null,
    sortType: 'latest' | 'popular' | 'random' = 'latest',
    page: number = 0,
    pageSize: number = 20,
    seed?: number,
    includeEnding: boolean = false,
    excludeWatched: boolean = false,
    contentType: ContentType | null = null,
    genreIds: number[] = [],
    countryCodes: string[] = [],
    releaseYearRange: { min: number; max: number } | null = null,
    minStarRating: number | null = null,
  ): Promise<{
    videos: Array<{
      videoId: string;
      contentId: number;
      contentType: ContentType;
      videoTitle: string;
      thumbnailUrl?: string;
      runtime?: number;
      channelId: string;
      channelName: string;
      channelLogoUrl: string;
      contentTitle: string;
      releaseDate?: string;
      genreIds?: number[];
      backdropPath?: string;
    }>;
    hasMore: boolean;
    totalCount: number;
  }> => {
    // excludeWatched 필터: 시청 기록이 있는 콘텐츠 ID 조회 (제외용)
    const excludeContentIds = excludeWatched ? await getUserWatchedContentIds() : null;

    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CHANNEL_VIDEOS, {
      p_channel_ids: channelIds,
      p_sort_type: sortType,
      p_page: page,
      p_page_size: pageSize,
      p_seed: seed,
      p_include_ending: includeEnding,
      p_exclude_content_ids: excludeContentIds,
      // 추가 필터 파라미터
      p_content_type: contentType,
      p_genre_ids: genreIds.length > 0 ? genreIds : null,
      p_origin_countries: countryCodes.length > 0 ? countryCodes : null,
      p_min_year: releaseYearRange?.min ?? null,
      p_max_year: releaseYearRange?.max ?? null,
      p_min_rating: minStarRating !== null ? minStarRating * 2 : null,
    });

    if (error) {
      console.error('채널 비디오 조회 실패:', error);
      throw new Error(`Failed to fetch channel videos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { videos: [], hasMore: false, totalCount: 0 };
    }

    const totalCount = Number(data[0]?.total_count ?? 0);
    const videos = data.map(
      (item: {
        video_id: string;
        content_id: number;
        content_type: string;
        video_title: string;
        thumbnail_url: string | null;
        runtime: number | null;
        channel_id: string;
        channel_name: string;
        channel_logo_url: string;
        content_title: string;
        release_date: string | null;
        genre_ids: number[] | null;
        backdrop_path: string | null;
      }) => ({
        videoId: item.video_id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        videoTitle: item.video_title,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        runtime: item.runtime ?? undefined,
        channelId: item.channel_id,
        channelName: item.channel_name,
        channelLogoUrl: item.channel_logo_url,
        contentTitle: item.content_title,
        releaseDate: item.release_date ?? undefined,
        genreIds: item.genre_ids ?? undefined,
        backdropPath: item.backdrop_path ?? undefined,
      }),
    );

    const hasMore = (page + 1) * pageSize < totalCount;

    return { videos, hasMore, totalCount };
  },
};
