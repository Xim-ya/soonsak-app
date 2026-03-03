/**
 * Push Notification Handler
 *
 * 푸시 알림 탭 시 실행되는 액션을 처리합니다.
 * NAVIGATION(화면 이동)과 ACTION(시스템 액션)을 지원합니다.
 *
 * @see docs/push-notification-deep-link-spec.md
 */
import { Linking, Platform } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import Constants from 'expo-constants';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import {
  type NotificationPayload,
  type NavigationAction,
  type SystemActionPayload,
  isNavigationAction,
  isSystemAction,
  isValidNotificationPayload,
} from '../types/notificationTypes';
import { pendingNavigationStore } from '../store/pendingNavigationStore';
import { PushLogger } from '@/shared/utils/logger';

type NavigationRef = NavigationContainerRef<RootStackParamList>;

interface HandleNotificationOptions {
  navigationRef: NavigationRef;
  onLogout?: () => Promise<void>;
  onRefreshData?: (target?: string) => Promise<void>;
}

/**
 * 푸시 알림 데이터 처리
 *
 * @param data 푸시 알림의 data 필드
 * @param options 핸들러 옵션
 * @returns 처리 성공 여부
 *
 * @example
 * // 알림 리스너에서 호출
 * Notifications.addNotificationResponseReceivedListener((response) => {
 *   const data = response.notification.request.content.data;
 *   handleNotification(data, {
 *     navigationRef,
 *     isLoggedIn: authStore.isLoggedIn,
 *   });
 * });
 */
export async function handleNotification(
  data: unknown,
  options: HandleNotificationOptions,
): Promise<boolean> {
  // 페이로드 유효성 검증
  if (!isValidNotificationPayload(data)) {
    PushLogger.warn('Invalid payload:', data);
    return false;
  }

  const payload = data as NotificationPayload;
  const { action } = payload;

  try {
    if (isNavigationAction(action)) {
      return handleNavigation(action, options);
    }

    if (isSystemAction(action)) {
      return handleSystemAction(action, options);
    }

    PushLogger.warn('Unknown action type:', action);
    return false;
  } catch (error) {
    PushLogger.error('Handler error:', error);
    return false;
  }
}

/**
 * NAVIGATION 액션 처리
 *
 * 화면으로 이동합니다. 인증 체크는 AuthGuard 미들웨어가 처리합니다.
 */
function handleNavigation(action: NavigationAction, options: HandleNotificationOptions): boolean {
  const { navigationRef } = options;
  const { screen, params } = action;

  // 화면 이동 (navigate의 타입 시그니처에 맞게 호출)
  // 인증 필요 화면은 AuthGuard가 감지하여 로그인으로 리다이렉트
  (navigationRef.navigate as (screen: string, params?: unknown) => void)(screen, params);
  return true;
}

/**
 * 스토어 설정
 * - iOS App ID: App Store Connect에서 확인 (앱 배포 후 고정값)
 * - Android Package: expo-constants에서 자동으로 가져옴
 */
const getStoreConfig = () => ({
  iosAppId: '6758769228',
  androidPackageName: Constants.expoConfig?.android?.package ?? 'com.soonsak.app',
});

/**
 * URL 안전하게 열기
 *
 * canOpenURL로 확인 후 열기를 시도하고, 실패 시 에러 로깅
 */
async function safeOpenURL(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      PushLogger.warn('URL을 열 수 없습니다:', url);
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (error) {
    PushLogger.error('URL 열기 실패:', error);
    return false;
  }
}

/**
 * ACTION(시스템 액션) 처리
 */
async function handleSystemAction(
  action: SystemActionPayload,
  options: HandleNotificationOptions,
): Promise<boolean> {
  const { navigationRef, onLogout, onRefreshData } = options;

  switch (action.action) {
    case 'LOGOUT':
      if (onLogout) {
        await onLogout();
      }
      return true;

    case 'REQUEST_REVIEW': {
      // 스토어 리뷰 페이지로 이동
      const storeConfig = getStoreConfig();
      const storeUrl =
        Platform.OS === 'ios'
          ? `https://apps.apple.com/app/id${storeConfig.iosAppId}?action=write-review`
          : `market://details?id=${storeConfig.androidPackageName}`;
      return await safeOpenURL(storeUrl);
    }

    case 'OPEN_SETTINGS':
      navigationRef.navigate(routePages.settings);
      return true;

    case 'OPEN_URL': {
      const url = action.payload?.['url'] as string | undefined;
      if (!url) {
        PushLogger.warn('OPEN_URL: URL이 없습니다');
        return false;
      }
      return await safeOpenURL(url);
    }

    case 'REFRESH_DATA':
      if (onRefreshData) {
        const target = action.payload?.['target'] as string | undefined;
        await onRefreshData(target);
      }
      return true;

    default:
      PushLogger.warn('Unknown system action:', action.action);
      return false;
  }
}

/**
 * 로그인 성공 후 pending navigation 처리
 *
 * 로그인 성공 콜백에서 호출하여 저장된 목적지로 이동합니다.
 * 로그인 화면을 스택에서 제거하고 [MainTabs, 목적지] 구조로 리셋합니다.
 *
 * @example
 * // 로그인 성공 시
 * const onLoginSuccess = () => {
 *   handlePendingNavigation(navigationRef);
 * };
 */
export function handlePendingNavigation(navigationRef: NavigationRef): boolean {
  const pending = pendingNavigationStore.get();

  if (!pending) {
    return false;
  }

  pendingNavigationStore.clear();

  // 로그인 화면을 스택에서 제거하고 [MainTabs, 목적지] 구조로 리셋
  // 뒤로가기 시 로그인 화면이 아닌 MainTabs로 이동
  navigationRef.reset({
    index: 1,
    routes: [
      { name: routePages.mainTabs },
      { name: pending.screen, params: pending.params as object | undefined },
    ],
  });

  return true;
}
