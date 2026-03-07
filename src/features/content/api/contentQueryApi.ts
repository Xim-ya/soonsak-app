import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import { ContentDto, VideoDto } from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import { ContentType } from '@/core/types/content/contentType.enum';

export const contentQueryApi = {
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
      ContentLogger.error('콘텐츠 수 조회 실패:', countResult.error);
      throw new Error(`Failed to count contents: ${countResult.error.message}`);
    }

    if (dataResult.error) {
      ContentLogger.error('콘텐츠 조회 실패:', dataResult.error);
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
      ContentLogger.error('비디오 조회 실패:', error);
      throw new Error(`Failed to fetch videos: ${error.message}`);
    }

    const videos: VideoDto[] = mapWithField<VideoDto[]>(data ?? []);

    return videos ?? [];
  },

  /**
   * 한글 초성 검색 지원 콘텐츠 검색
   * - 공백 무시: "그 을" -> "그을린 사랑" 매칭
   * - 초성 검색: "ㄱㅇㄹ ㅅㄹ" -> "그을린 사랑" 매칭
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
      ContentLogger.error('한글 검색 실패:', error);
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
      ContentLogger.error('등록된 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch registered contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * 전체 콘텐츠 수 조회
   */
  getTotalContentCount: async (): Promise<number> => {
    const { count, error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      ContentLogger.error('콘텐츠 수 조회 실패:', error);
      throw new Error(`Failed to count contents: ${error.message}`);
    }

    return count ?? 0;
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
      ContentLogger.error(`콘텐츠 조회 실패 (${contentType}):`, error);
      throw new Error(`Failed to fetch ${contentType} contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },
};
