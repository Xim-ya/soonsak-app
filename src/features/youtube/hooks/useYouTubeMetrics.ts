/**
 * YouTube 메트릭스 전용 Hook
 * 조회수, 좋아요 등 수치 데이터만 필요할 때 사용
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { YouTubeApiError, YouTubeVideoDto } from '../types';
import { youtubeApi } from '../api';
import { youtubeKeys } from './youtubeQueryKeys';

/**
 * YouTube 비디오 메트릭스 조회 Hook
 */
export const useYouTubeMetrics = (
  urlOrId?: string,
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: youtubeKeys.metrics(urlOrId ?? ''),
    queryFn: () => youtubeApi.getVideoMetrics(urlOrId!),
    enabled: !!urlOrId && (options?.enabled ?? true),
    staleTime: Infinity, // 데이터는 한 번 가져온 후 수동 새로고침 전까지 유지
    gcTime: Infinity, // 캐시는 명시적으로 제거하기 전까지 유지
    retry: (failureCount, error) => {
      if (error instanceof YouTubeApiError) {
        return error.retry && failureCount < 1;
      }
      return false;
    },
  });
};

/**
 * 메트릭스 수동 갱신 Hook
 * 필요 시 수동으로 메트릭스를 갱신
 * @deprecated 자동 갱신 제거 - 불필요한 네트워크 요청 방지
 */
export const useManualRefreshMetrics = (urlOrId?: string) => {
  const queryClient = useQueryClient();

  // 수동 갱신 함수
  const refreshMetrics = () => {
    if (urlOrId) {
      queryClient.invalidateQueries({ queryKey: youtubeKeys.metrics(urlOrId) });
    }
  };

  const query = useYouTubeMetrics(urlOrId);

  return {
    ...query,
    refresh: refreshMetrics,
    lastUpdated: query.dataUpdatedAt,
  };
};

/**
 * 메트릭스 포맷팅 Hook
 * 숫자를 한국어/영어 축약 형태로 변환
 */
export const useFormattedMetrics = (metrics?: YouTubeVideoDto['metrics']) => {
  if (!metrics) return null;

  const formatNumber = (num: number, korean: boolean = true) => {
    if (num < 1000) return num.toString();

    if (korean) {
      if (num >= 100000000) return `${(num / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
      if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}만`;
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}천`;
    } else {
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
  };

  return {
    viewCount: {
      raw: metrics.viewCount,
      formatted: formatNumber(metrics.viewCount),
      text: metrics.likeText || formatNumber(metrics.viewCount),
    },
    likeCount: {
      raw: metrics.likeCount,
      formatted: formatNumber(metrics.likeCount),
      text: metrics.likeText || formatNumber(metrics.likeCount),
    },
  };
};
