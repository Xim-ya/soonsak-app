import { useQuery } from '@tanstack/react-query';
import { ContentDetailModel } from '../_types/contentDetailModel.cd';
import { ContentType } from '@/core/types/content/contentType.enum';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import { MovieDto } from '@/features/tmdb/types/movieDto';
import { TvSeriesDto } from '@/features/tmdb/types/tvDto';
import { supabaseClient } from '@/core/api';
import { CONTENT_DATABASE } from '@/core/config';
import { ContentLogger } from '@/core/utils';

/**
 * Supabase에서 커스텀 backdrop_path 조회
 */
async function fetchCustomBackdropPath(
  contentId: number,
  contentType: ContentType,
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from(CONTENT_DATABASE.TABLES.CONTENTS)
    .select('backdrop_path')
    .eq('id', contentId)
    .eq('content_type', contentType)
    .single();

  if (error || !data) {
    return null;
  }

  return data.backdrop_path as string | null;
}

interface UseContentDetailOptions {
  /** 쿼리 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

/**
 * useContentDetail - 콘텐츠 상세 정보를 관리하는 훅
 *
 * TMDB API를 직접 호출하여 Movie/TV 데이터를 ContentDetailModel로 변환합니다.
 * Supabase DB에 커스텀 backdrop_path가 있으면 우선 사용합니다.
 * React Query를 사용하여 캐싱과 중복 요청 방지를 자동으로 처리합니다.
 *
 * @param contentId - 콘텐츠 고유 ID (필수)
 * @param contentType - 콘텐츠 타입 ('movie' | 'tv') (필수)
 * @param options - 추가 옵션 (enabled 등)
 * @returns 콘텐츠 데이터, 로딩 상태, 에러 상태
 *
 * @example
 * // Movie 데이터 조회
 * const { data, isLoading, error } = useContentDetail(550, 'movie');
 *
 * // TV 시리즈 데이터 조회
 * const { data, isLoading, error } = useContentDetail(1396, 'tv');
 *
 * // 조건부 조회 (외부 데이터가 없을 때만)
 * const { data } = useContentDetail(id, type, { enabled: !externalData });
 */
export function useContentDetail(
  contentId: number,
  contentType: ContentType,
  options?: UseContentDetailOptions,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['contentDetail', contentId, contentType],
    queryFn: async (): Promise<ContentDetailModel> => {
      try {
        // TMDB와 Supabase를 병렬로 조회
        const [tmdbResult, customBackdropPath] = await Promise.all([
          contentType === 'movie'
            ? tmdbApi.getMovieDetails(contentId)
            : tmdbApi.getTvDetails(contentId),
          fetchCustomBackdropPath(contentId, contentType),
        ]);

        const rawData: MovieDto | TvSeriesDto = tmdbResult.data;

        // Movie/TV 데이터를 ContentDetailModel로 변환
        const model = ContentDetailModel.fromDto(rawData, contentType);

        // Supabase에 커스텀 backdrop이 있으면 덮어쓰기
        if (customBackdropPath) {
          return {
            ...model,
            backdropPath: customBackdropPath,
          };
        }

        return model;
      } catch (error) {
        ContentLogger.error('콘텐츠 상세 정보 조회 실패:', {
          contentId,
          contentType,
          error,
        });
        throw error;
      }
    },
    enabled: (options?.enabled ?? true) && (contentType === 'movie' || contentType === 'tv'),
    retry: false,
  });

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
  };
}
