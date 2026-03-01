/**
 * useChannelManagement - 채널 관리 훅
 *
 * 무한스크롤 채널 목록 관리 로직을 담당합니다.
 */

import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { adminChannelApi, type ChannelManagementItem } from '@/features/admin';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

const QUERY_KEYS = {
  channels: ['adminChannels'] as const,
} as const;

// ============================================================================
// Types
// ============================================================================

interface UseChannelManagementReturn {
  /** 채널 목록 */
  readonly channels: ChannelManagementItem[];
  /** 로딩 중 여부 */
  readonly isLoading: boolean;
  /** 추가 로딩 중 여부 */
  readonly isFetchingNextPage: boolean;
  /** 다음 페이지 존재 여부 */
  readonly hasNextPage: boolean;
  /** 다음 페이지 로드 */
  readonly fetchNextPage: () => void;
  /** 새로고침 */
  readonly refetch: () => void;
  /** 새로고침 중 여부 */
  readonly isRefreshing: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useChannelManagement(): UseChannelManagementReturn {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 채널 목록 무한스크롤 조회
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage = false,
    fetchNextPage: fetchNextPageQuery,
    refetch: refetchChannels,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.channels,
    queryFn: ({ pageParam }) => adminChannelApi.getChannels(pageParam, PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30초
  });

  // 전체 채널 목록 평탄화
  const channels = useMemo(() => data?.pages.flatMap((page) => page.channels) ?? [], [data]);

  // 다음 페이지 로드
  const fetchNextPage = useCallback(() => {
    const canFetchMore = hasNextPage && !isFetchingNextPage;
    if (canFetchMore) {
      fetchNextPageQuery();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPageQuery]);

  // 새로고침 (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchChannels();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchChannels]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channels });
    }, [queryClient]),
  );

  return {
    channels,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: handleRefresh,
    isRefreshing,
  };
}
