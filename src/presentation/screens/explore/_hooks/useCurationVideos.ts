/**
 * useCurationVideos - 큐레이션 캐러셀용 비디오 조회 훅
 *
 * 랜덤으로 선정된 대표 비디오 목록을 조회합니다.
 * 10분간 캐시되어 불필요한 요청을 방지합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import type { CurationVideoModel } from '../_types/exploreTypes';

const CURATION_LIMIT = 10;
const STALE_TIME = 10 * 60 * 1000; // 10분
const GC_TIME = 30 * 60 * 1000; // 30분

interface UseCurationVideosReturn {
  videos: CurationVideoModel[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCurationVideos(): UseCurationVideosReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['curationVideos'],
    queryFn: () => contentApi.getCurationVideos(CURATION_LIMIT),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    videos: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
