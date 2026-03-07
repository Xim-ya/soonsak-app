import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import { ContentDto } from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import type { ContentFilter } from '@/core/types/filter/contentFilter';
import {
  MAX_EXCLUDE_IDS,
  applyContentFilters,
  getUserWatchedContentIds,
} from './contentApiUtils';

export const contentExploreApi = {
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
      ContentLogger.error('콘텐츠 수 조회 실패:', countError);
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
      ContentLogger.error('랜덤 콘텐츠 조회 실패:', error);
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
        ContentLogger.error('채널 콘텐츠 ID 조회 실패:', videoError);
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
      ContentLogger.error('필터 콘텐츠 수 조회 실패:', countError);
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
      ContentLogger.error('필터 랜덤 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch filtered random contents: ${error.message}`);
    }

    const contents = mapWithField<ContentDto[]>(data ?? []);
    return contents.sort(() => Math.random() - 0.5);
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
        ContentLogger.error('채널 콘텐츠 ID 조회 실패:', videoError);
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
        ContentLogger.error('결말 포함 콘텐츠 ID 조회 실패:', endingError);
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
        ContentLogger.error('시드 랜덤 콘텐츠 조회 실패:', rpcError);
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
        ContentLogger.error('인기순 콘텐츠 조회 실패:', rpcError);
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
      ContentLogger.error('탐색 콘텐츠 수 조회 실패:', countError);
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
      ContentLogger.error('탐색 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch explore contents: ${error.message}`);
    }

    const contents = mapWithField<ContentDto[]>(data ?? []);
    const hasMore = (page + 1) * pageSize < totalCount;

    return { contents, hasMore, totalCount };
  },
};
