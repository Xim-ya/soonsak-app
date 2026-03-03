/**
 * useNotificationList - 알림 목록 화면 로직 훅
 *
 * 알림 목록 화면에서 사용하는 상태와 핸들러를 관리합니다.
 *
 * @description
 * - Readability 원칙: 딥링크 라우팅 로직을 별도 유틸리티로 분리
 * - Cohesion 원칙: 화면 관련 로직만 이 훅에 유지
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import { analyticsService } from '@/shared/analytics';
import {
  useInfiniteNotifications,
  useMarkNotificationAsClicked,
  useMarkAllNotificationsAsRead,
  type NotificationItem,
} from '@/features/notifications';
import { useDialog } from '@/presentation/components/dialog';
import {
  handleNotificationDeepLink,
  extractDeepLinkScreen,
} from '../_utils/notificationDeepLinkRouter';

export function useNotificationList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showDialog } = useDialog();

  // 알림 목록 무한 스크롤
  const {
    items,
    isLoading,
    isError,
    isEmpty,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteNotifications();

  // 알림 목록 진입 이벤트 로깅 (최초 1회만)
  const hasLoggedViewRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !hasLoggedViewRef.current) {
      hasLoggedViewRef.current = true;
      const unreadCount = items.filter((item) => !item.readAt).length;
      analyticsService.notificationListView({
        unread_count: unreadCount,
      });
    }
  }, [isLoading, items]);

  // 알림 클릭 처리
  const markAsClickedMutation = useMarkNotificationAsClicked();

  // 모든 알림 읽음 처리
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  /**
   * 알림 아이템 클릭 핸들러
   *
   * 1. 알림을 읽음 처리
   * 2. 딥링크가 있으면 해당 화면으로 네비게이션
   * 3. 딥링크가 없으면 다이얼로그로 알림 내용 표시
   */
  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      // 딥링크 정보 추출
      const deepLinkScreen = extractDeepLinkScreen(item);
      const hasDeepLink = !!deepLinkScreen;

      // 알림 클릭 이벤트 로깅
      analyticsService.notificationClick({
        notification_id: item.notificationId,
        notification_type: item.notificationType,
        has_deep_link: hasDeepLink,
        deep_link_screen: deepLinkScreen,
      });

      // 클릭 처리 (읽음 + 클릭 기록)
      markAsClickedMutation.mutate(item.notificationId);

      // 딥링크 처리 (별도 유틸리티로 위임)
      const didNavigate = handleNotificationDeepLink(navigation, item);

      // 이동할 화면이 없으면 다이얼로그로 알림 내용 표시
      if (!didNavigate) {
        showDialog({
          title: item.title,
          description: item.body,
        });
      }
    },
    [navigation, markAsClickedMutation, showDialog],
  );

  /**
   * 뒤로가기 핸들러
   */
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * 모든 알림 읽음 처리 핸들러
   */
  const handleMarkAllAsRead = useCallback(() => {
    // 읽지 않은 알림 개수 계산
    const unreadCount = items.filter((item) => !item.readAt).length;

    // 모두 읽음 이벤트 로깅
    analyticsService.notificationMarkAllRead({
      count: unreadCount,
    });

    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation, items]);

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * 다음 페이지 로드 핸들러
   */
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // 데이터
    items,
    isLoading,
    isError,
    isEmpty,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    // 핸들러
    handleNotificationPress,
    handleGoBack,
    handleMarkAllAsRead,
    handleRefresh,
    handleLoadMore,
  };
}
