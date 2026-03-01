/**
 * useRatingsCount - 내 평점 개수 조회 Hook
 *
 * MyPage 전용 hook으로, 사용자가 등록한 평점 개수를 조회합니다.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { ratingsApi, ratingKeys } from '@/features/ratings';

/** 캐시 시간 상수 */
const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const useRatingsCount = (options?: { enabled?: boolean }): UseQueryResult<number, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ratingKeys.count(userId),
    queryFn: () => ratingsApi.getRatingsCount(),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: 0,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};
