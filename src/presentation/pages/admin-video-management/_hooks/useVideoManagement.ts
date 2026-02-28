/**
 * useVideoManagement - 비디오 관리 훅
 *
 * 무한스크롤 + 필터 로직을 관리합니다.
 */

import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { adminVideoApi, type VideoStatusCounts } from '@/features/admin';
import { ContentStatus } from '@/features/content/types';
import { fromVideoManagementDto, type VideoManagementModel } from '../_types';
import type { FilterStatus } from '../_components';

const PAGE_SIZE = 20;

interface UseVideoManagementReturn {
  /** 비디오 목록 */
  readonly videos: VideoManagementModel[];
  /** 상태별 카운트 */
  readonly counts: VideoStatusCounts;
  /** 선택된 필터 상태 */
  readonly selectedStatus: FilterStatus;
  /** 필터 상태 변경 */
  readonly onSelectStatus: (status: FilterStatus) => void;
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

export function useVideoManagement(): UseVideoManagementReturn {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API 파라미터로 변환
  const statusParam: ContentStatus | null = selectedStatus === 'all' ? null : selectedStatus;

  // 상태별 카운트 조회
  const { data: counts = DEFAULT_COUNTS } = useQuery({
    queryKey: ['adminVideoStatusCounts'],
    queryFn: adminVideoApi.getVideoStatusCounts,
    staleTime: 30 * 1000, // 30초
  });

  // 비디오 목록 무한스크롤 조회
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage = false,
    fetchNextPage,
    refetch: refetchVideos,
  } = useInfiniteQuery({
    queryKey: ['adminVideos', statusParam],
    queryFn: ({ pageParam }) => adminVideoApi.getVideosByStatus(statusParam, pageParam, PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30초
  });

  // 전체 비디오 목록 평탄화 + DTO → Model 변환
  const videos = useMemo(() => {
    return data?.pages.flatMap((page) => page.videos.map(fromVideoManagementDto)) ?? [];
  }, [data]);

  // 필터 상태 변경
  const onSelectStatus = useCallback((status: FilterStatus) => {
    setSelectedStatus(status);
  }, []);

  // 다음 페이지 로드
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 새로고침 (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 카운트와 목록 모두 새로고침
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminVideoStatusCounts'] }),
        refetchVideos(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetchVideos]);

  // 화면 포커스 시 데이터 새로고침 (ContentDetailPage에서 상태 변경 후 돌아왔을 때)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['adminVideoStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
    }, [queryClient]),
  );

  return {
    videos,
    counts,
    selectedStatus,
    onSelectStatus,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: handleFetchNextPage,
    refetch: handleRefresh,
    isRefreshing,
  };
}

const DEFAULT_COUNTS: VideoStatusCounts = {
  total: 0,
  pending: 0,
  confirmed: 0,
  rejected: 0,
  needsReview: 0,
};
