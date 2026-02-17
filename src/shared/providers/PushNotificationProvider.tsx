/**
 * PushNotificationProvider - 푸시 알림 상태 관리
 *
 * Expo Push Notifications의 초기화, 토큰 관리, 알림 수신을 담당합니다.
 * AuthProvider와 함께 사용하여 로그인/로그아웃 시 토큰을 동기화합니다.
 *
 * @example
 * // App.tsx에서 사용
 * <AuthProvider>
 *   <PushNotificationProvider>
 *     <AppContent />
 *   </PushNotificationProvider>
 * </AuthProvider>
 *
 * // 하위 컴포넌트에서 알림 상태 접근
 * const { notification } = usePushNotification();
 */
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';
import { pushTokenApi } from '@/features/push-notifications';
import { useAuth } from './AuthProvider';

/** PushNotificationContext 값 타입 */
interface PushNotificationContextValue {
  /** Expo Push Token */
  expoPushToken: string | null;
  /** 현재 수신된 알림 (Foreground) */
  notification: Notifications.Notification | null;
  /** 권한 상태 */
  permissionStatus: Notifications.PermissionStatus | null;
  /** 에러 메시지 */
  error: string | null;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { status, user } = useAuth();
  const { expoPushToken, notification, permissionStatus, error } = usePushNotifications();
  const lastSyncedTokenRef = useRef<string | null>(null);

  // 로그인 상태 + 토큰 변경 시 서버 동기화
  useEffect(() => {
    // 동기화 조건: 인증됨 + 유저 존재 + 토큰 존재 + 이전과 다른 토큰
    const shouldSync =
      status === 'authenticated' &&
      user &&
      expoPushToken &&
      lastSyncedTokenRef.current !== expoPushToken;

    if (!shouldSync) return;

    const syncToken = async () => {
      try {
        await pushTokenApi.syncToken(user.id, expoPushToken);
        lastSyncedTokenRef.current = expoPushToken;
        if (__DEV__) {
          console.log('[PushNotificationProvider] 토큰 동기화 완료');
        }
      } catch (err) {
        console.error('[PushNotificationProvider] 토큰 동기화 실패:', err);
      }
    };

    syncToken();
  }, [status, user, expoPushToken]);

  const value: PushNotificationContextValue = {
    expoPushToken,
    notification,
    permissionStatus,
    error,
  };

  return (
    <PushNotificationContext.Provider value={value}>{children}</PushNotificationContext.Provider>
  );
}

/**
 * usePushNotification - 푸시 알림 상태 접근 훅
 *
 * PushNotificationProvider 내에서만 사용 가능합니다.
 *
 * @returns PushNotificationContextValue
 * - expoPushToken: Expo Push Token
 * - notification: 현재 수신된 알림
 * - permissionStatus: 권한 상태
 * - error: 에러 메시지
 *
 * @example
 * const { notification, expoPushToken } = usePushNotification();
 *
 * useEffect(() => {
 *   if (notification) {
 *     console.log('새 알림:', notification.request.content.title);
 *   }
 * }, [notification]);
 */
export function usePushNotification(): PushNotificationContextValue {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }

  return context;
}
