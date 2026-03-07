/**
 * 알림 React Query Hooks
 *
 * 사용자 푸시 알림 조회 및 관리를 위한 훅들을 제공합니다.
 * - 알림 목록 무한 스크롤
 * - 읽지 않은 알림 개수 조회
 * - 알림 읽음 처리
 */

import React from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  UseQueryResult,
  InfiniteData,
} from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { usePushNotification } from '@/features/push-notifications';
import { notificationApi } from '../api/notificationApi';
import { notificationKeys } from './notificationQueryKeys';
import type {
  NotificationItem,
  NotificationListResult,
  UnreadNotificationCount,
} from '../types/notificationListTypes';

// ============================================================================
// Internal Types
// ============================================================================

/** 알림 목록 무한 스크롤 데이터 타입 */
type NotificationInfiniteData = InfiniteData<NotificationListResult, string | null>;

// ============================================================================
// Constants
// ============================================================================

/** 캐시 시간 상수 (밀리초) */
const CACHE_TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
} as const;

/** 기본 페이지 크기 */
const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Internal Hooks - 공통 패턴 추출 (Cohesion 원칙)
// ============================================================================

/**
 * 알림 관련 공통 컨텍스트 정보를 제공하는 내부 훅
 *
 * @description Coupling 원칙 - 반복되는 의존성 패턴을 하나로 통합
 */
function useNotificationContext() {
  const { user, status } = useAuth();
  const { expoPushToken } = usePushNotification();

  const userId = user?.id ?? null;
  const isAuthenticated = status === 'authenticated';
  const canFetch = isAuthenticated && !!userId;

  return {
    userId,
    expoPushToken,
    isAuthenticated,
    canFetch,
  };
}

/**
 * 알림 캐시 무효화 유틸리티 훅
 *
 * @description Cohesion 원칙 - 관련 캐시 무효화 로직 그룹화
 */
function useNotificationCacheInvalidation() {
  const queryClient = useQueryClient();
  const { userId, expoPushToken } = useNotificationContext();

  const invalidateCurrentDevice = React.useCallback(() => {
    // 읽지 않은 개수 캐시 무효화 (현재 디바이스)
    queryClient.invalidateQueries({
      queryKey: notificationKeys.unreadCount(userId, expoPushToken),
    });
    // 목록 캐시 무효화 (현재 디바이스)
    queryClient.invalidateQueries({
      queryKey: notificationKeys.list(userId, expoPushToken),
    });
  }, [queryClient, userId, expoPushToken]);

  const invalidateAllDevices = React.useCallback(() => {
    // 알림 관련 모든 캐시 무효화 (모든 디바이스)
    queryClient.invalidateQueries({
      queryKey: notificationKeys.all(userId),
    });
  }, [queryClient, userId]);

  return {
    invalidateCurrentDevice,
    invalidateAllDevices,
  };
}

// ============================================================================
// Public Hooks
// ============================================================================

/**
 * 읽지 않은 알림 개수 조회 Hook
 *
 * 헤더의 알림 뱃지에 표시할 개수를 조회합니다.
 * 현재 디바이스로 전송된 알림만 카운트합니다.
 * 로그인한 사용자만 사용 가능합니다.
 */
export const useUnreadNotificationCount = (options?: {
  enabled?: boolean;
}): UseQueryResult<UnreadNotificationCount, Error> => {
  const { userId, expoPushToken, canFetch } = useNotificationContext();

  return useQuery({
    queryKey: notificationKeys.unreadCount(userId, expoPushToken),
    queryFn: () => notificationApi.getUnreadCount(userId!, expoPushToken),
    enabled: (options?.enabled ?? true) && canFetch,
    placeholderData: { count: 0 },
    staleTime: CACHE_TIME.ONE_MINUTE,
    gcTime: CACHE_TIME.FIVE_MINUTES,
    refetchOnWindowFocus: true,
  });
};

/** useInfiniteNotifications 설정 타입 */
interface InfiniteNotificationsConfig {
  pageSize?: number;
  enabled?: boolean;
}

/** useInfiniteNotifications 반환 타입 */
interface InfiniteNotificationsResult {
  items: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isRefetching: boolean;
}

/**
 * 알림 목록 무한 스크롤 Hook
 *
 * 현재 디바이스로 전송된 알림 내역을 무한 스크롤로 조회합니다.
 */
export const useInfiniteNotifications = (
  config?: InfiniteNotificationsConfig,
): InfiniteNotificationsResult => {
  const { pageSize = DEFAULT_PAGE_SIZE, enabled = true } = config ?? {};
  const { userId, expoPushToken, canFetch } = useNotificationContext();

  const query = useInfiniteQuery({
    queryKey: [...notificationKeys.list(userId, expoPushToken), pageSize],
    queryFn: async ({ pageParam = null }) => {
      return notificationApi.getNotifications(userId!, {
        cursor: pageParam as string | null,
        limit: pageSize,
        pushToken: expoPushToken,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: enabled && canFetch,
    staleTime: CACHE_TIME.ONE_MINUTE,
    gcTime: CACHE_TIME.TEN_MINUTES,
  });

  // 페이지 데이터를 평탄화하여 아이템 목록 생성
  const items: NotificationItem[] = React.useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data?.pages],
  );

  // 빈 상태 여부 (로딩/에러가 아니면서 아이템이 없는 경우)
  const isEmpty = !query.isLoading && !query.isError && items.length === 0;

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

/**
 * 알림 읽음 처리 Mutation Hook
 */
export const useMarkNotificationAsRead = () => {
  const { userId } = useNotificationContext();
  const { invalidateCurrentDevice } = useNotificationCacheInvalidation();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!userId) {
        return Promise.reject(new Error('userId is required'));
      }
      return notificationApi.markAsRead(notificationId, userId);
    },
    onSuccess: invalidateCurrentDevice,
  });
};

/**
 * 알림 클릭 처리 Mutation Hook
 *
 * 낙관적 업데이트로 즉시 읽음 처리하고, 전체 리페치를 피합니다.
 * (리페치 시 RefreshControl이 표시되는 문제 방지)
 *
 * @description
 * prefix 기반 캐시 매칭으로 모든 pageSize 캐시를 업데이트합니다.
 */
export const useMarkNotificationAsClicked = () => {
  const queryClient = useQueryClient();
  const { userId, expoPushToken } = useNotificationContext();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!userId) {
        return Promise.reject(new Error('userId is required'));
      }
      return notificationApi.markAsClicked(notificationId, userId);
    },
    onMutate: async (notificationId: string) => {
      const listKeyPrefix = notificationKeys.list(userId, expoPushToken);

      // 진행 중인 쿼리 취소 (낙관적 업데이트와 충돌 방지)
      await queryClient.cancelQueries({
        queryKey: listKeyPrefix,
      });

      // prefix 기반으로 모든 list 캐시의 스냅샷 저장
      const allListCaches = queryClient.getQueriesData<NotificationInfiniteData>({
        queryKey: listKeyPrefix,
      });

      // 낙관적 업데이트: 모든 캐시에서 해당 알림의 readAt, clickedAt 즉시 업데이트
      const now = new Date().toISOString();
      allListCaches.forEach(([queryKey]) => {
        queryClient.setQueryData<NotificationInfiniteData>(queryKey, (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((notification) =>
                notification.notificationId === notificationId
                  ? {
                      ...notification,
                      readAt: notification.readAt ?? now,
                      clickedAt: now,
                    }
                  : notification,
              ),
            })),
          };
        });
      });

      return { previousCaches: allListCaches };
    },
    onError: (_error, _notificationId, context) => {
      // 에러 시 모든 캐시를 이전 데이터로 롤백
      if (context?.previousCaches) {
        context.previousCaches.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
    },
    onSettled: () => {
      // 읽지 않은 개수만 갱신 (목록은 낙관적 업데이트로 이미 처리됨)
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(userId, expoPushToken),
      });
    },
  });
};

/**
 * 모든 알림 읽음 처리 Mutation Hook
 *
 * 낙관적 업데이트로 모든 알림을 즉시 읽음 처리합니다.
 *
 * @description
 * prefix 기반 캐시 매칭으로 모든 pageSize 캐시를 업데이트합니다.
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { userId, expoPushToken } = useNotificationContext();

  return useMutation({
    mutationFn: () => {
      if (!userId) {
        return Promise.reject(new Error('userId is required'));
      }
      return notificationApi.markAllAsRead(userId);
    },
    onMutate: async () => {
      const listKeyPrefix = notificationKeys.list(userId, expoPushToken);

      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: listKeyPrefix,
      });

      // prefix 기반으로 모든 list 캐시의 스냅샷 저장
      const allListCaches = queryClient.getQueriesData<NotificationInfiniteData>({
        queryKey: listKeyPrefix,
      });

      // 낙관적 업데이트: 모든 캐시에서 모든 알림의 readAt 즉시 업데이트
      const now = new Date().toISOString();
      allListCaches.forEach(([queryKey]) => {
        queryClient.setQueryData<NotificationInfiniteData>(queryKey, (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((notification) => ({
                ...notification,
                readAt: notification.readAt ?? now,
              })),
            })),
          };
        });
      });

      return { previousCaches: allListCaches };
    },
    onError: (_error, _variables, context) => {
      // 에러 시 모든 캐시를 이전 데이터로 롤백
      if (context?.previousCaches) {
        context.previousCaches.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
    },
    onSettled: () => {
      // 읽지 않은 개수만 갱신
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(userId, expoPushToken),
      });
    },
  });
};
