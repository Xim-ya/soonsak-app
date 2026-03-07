import { useQuery } from '@tanstack/react-query';
import { WatchProviderModel } from '../types/watchProviderModel';
import { ContentType } from '@/core/types/content/contentType.enum';
import { tmdbApi } from '../api/tmdbApi';
import { tmdbKeys } from './tmdbQueryKeys';

interface UseWatchProvidersResult {
  readonly data: WatchProviderModel[];
  readonly isLoading: boolean;
  readonly error: Error | null;
}

/**
 * useWatchProviders - 콘텐츠 스트리밍 공급처 정보를 관리하는 훅
 *
 * TMDB API를 호출하여 KR 지역의 flatrate(구독형) 스트리밍 서비스를 조회합니다.
 * React Query를 사용하여 캐싱과 중복 요청 방지를 자동으로 처리합니다.
 *
 * @param contentId - 콘텐츠 고유 ID (필수)
 * @param contentType - 콘텐츠 타입 ('movie' | 'tv') (필수)
 * @returns 스트리밍 공급처 데이터, 로딩 상태, 에러 상태
 */
export function useWatchProviders(
  contentId: number,
  contentType: ContentType,
): UseWatchProvidersResult {
  const { data, isLoading, error } = useQuery({
    queryKey: tmdbKeys.watchProviders(contentId, contentType),
    queryFn: async (): Promise<WatchProviderModel[]> => {
      const response = await tmdbApi.getWatchProviders(contentId, contentType as 'movie' | 'tv');
      return WatchProviderModel.fromDto(response.data);
    },
    enabled: (contentType === 'movie' || contentType === 'tv') && !!contentId,
    retry: false,
  });

  return {
    data: data || [],
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
