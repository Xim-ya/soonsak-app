/**
 * useSyncAppBadge - 앱 아이콘 배지 카운트 동기화 훅
 *
 * 읽지 않은 알림 개수를 iOS/Android 앱 아이콘 배지에 동기화합니다.
 * - iOS: 앱 아이콘에 숫자 배지 표시
 * - Android: 일부 런처에서 배지 표시 (지원 여부는 런처에 따라 다름)
 *
 * @example
 * // App.tsx 또는 최상위 컴포넌트에서 호출
 * useSyncAppBadge();
 */

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useUnreadNotificationCount } from './useNotifications';
import { Logger } from '@/core/utils';

const BadgeLogger = Logger.create('Badge');

/**
 * 앱 아이콘 배지 카운트를 읽지 않은 알림 개수와 동기화합니다.
 *
 * 이 훅은 다음 시점에 배지를 업데이트합니다:
 * - 앱 시작 시
 * - 알림 읽음/클릭 처리 후 (캐시 무효화로 인한 refetch)
 * - 포커스 복귀 시 (refetchOnWindowFocus)
 */
export function useSyncAppBadge(): void {
  const { data } = useUnreadNotificationCount();
  const unreadCount = data?.count ?? 0;

  useEffect(() => {
    BadgeLogger.log('배지 카운트 설정:', unreadCount);

    // 배지 카운트 업데이트
    Notifications.setBadgeCountAsync(unreadCount).catch((error) => {
      // 배지 설정 실패는 치명적이지 않으므로 경고만 출력
      BadgeLogger.warn('배지 카운트 설정 실패:', error);
    });
  }, [unreadCount]);
}

/**
 * 앱 아이콘 배지를 초기화합니다 (0으로 설정).
 * 로그아웃 시 호출하면 좋습니다.
 */
export async function clearAppBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    BadgeLogger.warn('배지 초기화 실패:', error);
  }
}
