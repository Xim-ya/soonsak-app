import { useQuery } from '@tanstack/react-query';
import { CreditPersonModel } from '../_types/creditModel.cd';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import { TVCreditsResponse, MovieCreditsResponse } from '@/features/tmdb/types/creditDto';

/**
 * useCredits - 콘텐츠 크레딧 정보를 관리하는 훅
 *
 * TMDB API를 직접 호출하여 Movie/TV Credits 데이터를 CreditPersonModel[]로 변환합니다.
 * React Query를 사용하여 캐싱과 중복 요청 방지를 자동으로 처리합니다.
 *
 * @param contentId - 콘텐츠 고유 ID (필수)
 * @param contentType - 콘텐츠 타입 ('movie' | 'tv') (필수)
 * @returns 크레딧 데이터, 로딩 상태, 에러 상태
 *
 * @example
 * // Movie Credits 조회
 * const { data, isLoading, error } = useCredits(550, 'movie');
 *
 * // TV Series Credits 조회
 * const { data, isLoading, error } = useCredits(1396, 'tv');
 */
export function useCredits(contentId: number, contentType: ContentType) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['credits', contentId, contentType],
    queryFn: async (): Promise<CreditPersonModel[]> => {
      try {
        let rawData: TVCreditsResponse | MovieCreditsResponse;

        if (contentType === 'movie') {
          const response = await tmdbApi.getMovieCredits(contentId);
          rawData = response.data;
        } else if (contentType === 'tv') {
          const response = await tmdbApi.getTvCredits(contentId);
          rawData = response.data;
        } else {
          throw new Error(`지원하지 않는 콘텐츠 타입: ${contentType}`);
        }

        // Movie/TV Credits 데이터를 CreditPersonModel[]로 변환 후 최대 12개만 반환
        const credits = CreditPersonModel.fromDto(rawData, contentType);
        return credits.slice(0, 12);
      } catch (error) {
        console.error('[useCredits] 크레딧 정보 조회 실패:', {
          contentId,
          contentType,
          error,
        });
        throw error;
      }
    },
    enabled: (contentType === 'movie' || contentType === 'tv') && !!contentId,
    retry: false,
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
  };
}
