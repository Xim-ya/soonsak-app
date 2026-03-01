/**
 * YouTube 비디오 데이터를 가져오는 React Query Hook
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { YouTubeVideoDto, YouTubeApiError } from '../types';
import { youtubeApi } from '../api';
import { youtubeKeys } from './youtubeQueryKeys';

/**
 * YouTube 비디오 전체 메타데이터 조회 Hook
 */
export const useYouTubeVideo = (
  urlOrId?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  },
): UseQueryResult<YouTubeVideoDto, YouTubeApiError> => {
  return useQuery({
    queryKey: youtubeKeys.video(urlOrId ?? ''),
    queryFn: () => youtubeApi.getVideoMetadata(urlOrId!),
    enabled: !!urlOrId && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5분 fresh
    gcTime: options?.gcTime ?? 15 * 60 * 1000, // 15분 캐시
    retry: (failureCount, error) => {
      // YouTube API 에러에 따른 재시도 로직
      if (error instanceof YouTubeApiError) {
        return error.retry && failureCount < 2;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * YouTube 비디오 빠른 정보 조회 Hook (oEmbed만 사용)
 */
export const useYouTubeQuickInfo = (
  urlOrId?: string,
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: youtubeKeys.quick(urlOrId ?? ''),
    queryFn: () => youtubeApi.getQuickVideoInfo(urlOrId!),
    enabled: !!urlOrId && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000, // 10분 fresh (더 오래 캐시)
    gcTime: 30 * 60 * 1000, // 30분 캐시
  });
};

/**
 * 점진적 로딩 Hook
 * 1단계: 빠른 기본 정보 (oEmbed)
 * 2단계: 전체 상세 정보 (스크래핑 포함)
 */
export const useProgressiveYouTubeVideo = (urlOrId?: string) => {
  // 1단계: 빠른 데이터
  const quickQuery = useYouTubeQuickInfo(urlOrId);

  // 2단계: 전체 데이터 (빠른 데이터 로딩 완료 후)
  const fullQuery = useYouTubeVideo(urlOrId, {
    enabled: !!urlOrId && quickQuery.isSuccess,
  });

  return {
    // 가장 최신 데이터 반환 (전체 데이터 > 빠른 데이터)
    data: fullQuery.data || quickQuery.data,

    // 로딩 상태
    isLoading: quickQuery.isLoading,
    isLoadingFull: fullQuery.isLoading,
    isFullyLoaded: fullQuery.isSuccess,

    // 에러 상태
    error: fullQuery.error || quickQuery.error,
    isError: fullQuery.isError || quickQuery.isError,

    // 개별 쿼리 접근
    quick: quickQuery,
    full: fullQuery,
  };
};

/**
 * 여러 YouTube 비디오를 배치로 조회하는 Hook
 */
export const useMultipleYouTubeVideos = (
  urls: string[],
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: youtubeKeys.multiple(urls),
    queryFn: () => youtubeApi.getMultipleVideos(urls),
    enabled: urls.length > 0 && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
