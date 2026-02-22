/**
 * 시청 기록 React Query Hooks
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  UseQueryResult,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { watchHistoryApi } from '../api/watchHistoryApi';
import type { CreateWatchHistoryParams } from '../types';
import { WatchHistoryModel, WatchHistoryCalendarModel } from '../types/watchHistoryModel';

/** 캐시 시간 상수 */
const THIRTY_SECONDS = 30 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Query Key 팩토리
 * - userId를 포함하여 로그인 상태 변경 시 자동으로 새 캐시 사용
 */
export const watchHistoryKeys = {
  all: (userId: string | null) => ['watchHistory', userId] as const,
  fullyWatchedCount: (userId: string | null) =>
    [...watchHistoryKeys.all(userId), 'fullyWatchedCount'] as const,
  fullyWatchedList: (userId: string | null) =>
    [...watchHistoryKeys.all(userId), 'fullyWatchedList'] as const,
  calendar: (userId: string | null, year: number, month: number) =>
    [...watchHistoryKeys.all(userId), 'calendar', year, month] as const,
  byDate: (userId: string | null, date: string) =>
    [...watchHistoryKeys.all(userId), 'byDate', date] as const,
  list: (userId: string | null) => [...watchHistoryKeys.all(userId), 'list'] as const,
  uniqueList: (userId: string | null) => [...watchHistoryKeys.all(userId), 'uniqueList'] as const,
  progress: (userId: string | null, contentId: number, contentType: string) =>
    [...watchHistoryKeys.all(userId), 'progress', contentId, contentType] as const,
};

/**
 * 완료된 시청 개수 조회 Hook
 */
export const useFullyWatchedCount = (options?: {
  enabled?: boolean;
}): UseQueryResult<number, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: watchHistoryKeys.fullyWatchedCount(userId),
    queryFn: () => watchHistoryApi.getFullyWatchedCount(),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: 0,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 완료된 시청 목록 조회 Hook (페이지네이션)
 */
export const useFullyWatchedList = (
  limit: number = 20,
  offset: number = 0,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<
  {
    items: WatchHistoryModel[];
    hasMore: boolean;
    totalCount: number;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...watchHistoryKeys.fullyWatchedList(userId), limit, offset],
    queryFn: () => watchHistoryApi.getFullyWatchedList(limit, offset),
    select: (data) => ({
      items: WatchHistoryModel.fromDtoList(data.items),
      hasMore: data.hasMore,
      totalCount: data.totalCount,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { items: [], hasMore: false, totalCount: 0 },
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};

/**
 * 특정 날짜의 시청 기록 조회 Hook
 * 캘린더에서 날짜 클릭 시 사용
 */
export const useWatchHistoryByDate = (
  date: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<WatchHistoryModel[], Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: watchHistoryKeys.byDate(userId, date),
    queryFn: () => watchHistoryApi.getHistoryByDate(date),
    select: WatchHistoryModel.fromDtoList,
    enabled: (options?.enabled ?? true) && !!userId && !!date,
    placeholderData: [],
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};

/**
 * 월별 캘린더 시청 기록 조회 Hook
 */
export const useWatchHistoryCalendar = (
  year: number,
  month: number,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<WatchHistoryCalendarModel[], Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: watchHistoryKeys.calendar(userId, year, month),
    queryFn: () => watchHistoryApi.getCalendarHistory(year, month),
    select: WatchHistoryCalendarModel.fromDtoList,
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: [],
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 시청 기록 목록 조회 Hook (페이지네이션)
 */
export const useWatchHistoryList = (
  limit: number = 20,
  offset: number = 0,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<
  {
    items: WatchHistoryModel[];
    hasMore: boolean;
    totalCount: number;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...watchHistoryKeys.list(userId), limit, offset],
    queryFn: () => watchHistoryApi.getWatchHistoryList(limit, offset),
    select: (data) => ({
      items: WatchHistoryModel.fromDtoList(data.items),
      hasMore: data.hasMore,
      totalCount: data.totalCount,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { items: [], hasMore: false, totalCount: 0 },
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};

/**
 * 고유 콘텐츠 시청 기록 조회 Hook (중복 제거)
 */
export const useUniqueWatchHistory = (
  limit: number = 20,
  offset: number = 0,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<
  {
    items: WatchHistoryModel[];
    hasMore: boolean;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...watchHistoryKeys.uniqueList(userId), limit, offset],
    queryFn: () => watchHistoryApi.getUniqueContentHistory(limit, offset),
    select: (data) => ({
      items: WatchHistoryModel.fromDtoList(data.items),
      hasMore: data.hasMore,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { items: [], hasMore: false },
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};

/**
 * 시청 기록 프리뷰 무한 스크롤 Hook (가로 리스트용)
 * MyPage 등 프리뷰 섹션에서 사용
 * 최대 아이템 수 제한을 지원하며, 스크롤 끝에서 다음 페이지 로드
 */
export const useWatchHistoryPreview = (config?: {
  pageSize?: number;
  maxItems?: number;
  enabled?: boolean;
}) => {
  const { pageSize = 6, maxItems = 12, enabled = true } = config ?? {};
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const isGuest = status === 'unauthenticated';

  const query = useInfiniteQuery({
    queryKey: [...watchHistoryKeys.uniqueList(userId), 'preview', pageSize, maxItems],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await watchHistoryApi.getUniqueContentHistory(pageSize, pageParam);
      return {
        items: WatchHistoryModel.fromDtoList(data.items),
        hasMore: data.hasMore,
        nextOffset: pageParam + pageSize,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 최대 아이템 수 도달 시 더 이상 로드하지 않음
      const totalLoaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      if (totalLoaded >= maxItems) return undefined;
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    enabled: enabled && !!userId,
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });

  // 평탄화된 아이템 목록 (최대 개수 제한 적용)
  const items = (query.data?.pages.flatMap((page) => page.items) ?? []).slice(0, maxItems);

  // 더 로드할 수 있는지 여부
  const canLoadMore = query.hasNextPage && items.length < maxItems && !query.isFetchingNextPage;

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: canLoadMore,
    isGuest,
    fetchNextPage: query.fetchNextPage,
  };
};

/**
 * 고유 콘텐츠 시청 기록 무한 스크롤 Hook
 * 전체 시청 기록 페이지에서 사용
 */
export const useInfiniteUniqueWatchHistory = (
  pageSize: number = 20,
  options?: {
    enabled?: boolean;
  },
): UseInfiniteQueryResult<
  {
    pages: Array<{
      items: WatchHistoryModel[];
      hasMore: boolean;
      nextOffset: number;
    }>;
    pageParams: number[];
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: [...watchHistoryKeys.uniqueList(userId), 'infinite', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await watchHistoryApi.getUniqueContentHistory(pageSize, pageParam);
      return {
        items: WatchHistoryModel.fromDtoList(data.items),
        hasMore: data.hasMore,
        nextOffset: pageParam + pageSize,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};

/**
 * 시청 기록 추가 Mutation Hook
 */
export const useAddWatchHistory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: CreateWatchHistoryParams) => watchHistoryApi.addWatchHistory(params),
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all(userId) });
    },
    onError: (error) => {
      console.error('시청 기록 추가 실패:', error);
    },
  });
};

/**
 * 시청 기록 삭제 Mutation Hook
 */
export const useDeleteWatchHistory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (historyId: string) => watchHistoryApi.deleteWatchHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all(userId) });
    },
    onError: (error) => {
      console.error('시청 기록 삭제 실패:', error);
    },
  });
};

/**
 * 전체 시청 기록 삭제 Mutation Hook
 */
export const useClearAllWatchHistory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: () => watchHistoryApi.clearAllWatchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all(userId) });
    },
    onError: (error) => {
      console.error('전체 시청 기록 삭제 실패:', error);
    },
  });
};

/**
 * 특정 콘텐츠의 시청 진행률 조회 Hook
 * 이어보기 기능에서 사용
 */
export const useContentProgress = (
  contentId: number,
  contentType: string,
  options?: { enabled?: boolean },
): UseQueryResult<
  { progressSeconds: number; durationSeconds: number; videoId: string | null } | null,
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: watchHistoryKeys.progress(userId, contentId, contentType),
    queryFn: () => watchHistoryApi.getContentProgress(contentId, contentType),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: null,
    staleTime: THIRTY_SECONDS,
    gcTime: FIVE_MINUTES,
  });
};
