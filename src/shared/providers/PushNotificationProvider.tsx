/**
 * PushNotificationProvider - 푸시 알림 상태 관리
 *
 * Expo Push Notifications의 초기화, 토큰 관리, 알림 수신을 담당합니다.
 * AuthProvider와 함께 사용하여 로그인/로그아웃 시 토큰을 동기화합니다.
 *
 * 푸시 알림 탭 시 해당 화면으로 이동하며, 인증 필요 화면은
 * AuthGuard 미들웨어가 자동으로 로그인 리다이렉트를 처리합니다.
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
import { pushTokenApi, handleNotification } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
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
  const { status, user, signOut } = useAuth();
  const { expoPushToken, notification, permissionStatus, error } = usePushNotifications();
  const lastSyncedTokenRef = useRef<string | null>(null);

  // Killed 상태에서 시작 시 사용할 signOut 캡처
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  // 이미 처리한 알림 응답 ID 추적 (중복 처리 방지)
  // Set을 사용하여 연속 알림(A → B → A) 시나리오도 처리
  const handledNotificationIdsRef = useRef<Set<string>>(new Set());
  const MAX_TRACKED_IDS = 50; // 메모리 관리를 위한 최대 추적 수

  // 앱이 종료 상태(Killed)에서 푸시 알림으로 시작된 경우 처리
  // status가 idle이면 AuthProvider 세션 복원이 완료되지 않았으므로 대기
  useEffect(() => {
    // AuthProvider 초기화 대기
    if (status === 'idle') return;

    const handleInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response && navigationRef.isReady()) {
        // 알림 응답 ID로 중복 처리 방지
        const notificationId = response.notification.request.identifier;
        if (handledNotificationIdsRef.current.has(notificationId)) {
          if (__DEV__) {
            console.log('[PushNotificationProvider] 이미 처리한 알림, 무시:', notificationId);
          }
          return;
        }

        // ID 추가 및 메모리 관리
        handledNotificationIdsRef.current.add(notificationId);
        if (handledNotificationIdsRef.current.size > MAX_TRACKED_IDS) {
          const idsArray = Array.from(handledNotificationIdsRef.current);
          handledNotificationIdsRef.current = new Set(idsArray.slice(-25));
        }

        const data = response.notification.request.content.data;
        handleNotification(data, {
          navigationRef: navigationRef,
          onLogout: signOutRef.current,
        });
      }
    };

    // navigationRef가 준비된 후 처리
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 100ms * 50 = 5초

    const checkReady = setInterval(() => {
      attempts += 1;
      if (navigationRef.isReady() || attempts >= MAX_ATTEMPTS) {
        clearInterval(checkReady);
        if (navigationRef.isReady()) {
          handleInitialNotification();
        } else {
          // 타임아웃: navigationRef가 5초 내 준비되지 않음
          console.error('[PushNotificationProvider] navigationRef 준비 타임아웃 - 알림 처리 실패');
        }
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, [status]); // status가 idle에서 변경될 때 실행

  // 앱이 실행 중일 때 푸시 알림 탭 처리
  // ref 패턴으로 최신 상태 참조 (구독 재등록 방지)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!navigationRef.isReady()) {
        if (__DEV__) {
          console.warn('[PushNotificationProvider] navigationRef가 준비되지 않음');
        }
        return;
      }

      // 알림 응답 ID로 중복 처리 방지
      const notificationId = response.notification.request.identifier;
      if (handledNotificationIdsRef.current.has(notificationId)) {
        if (__DEV__) {
          console.log('[PushNotificationProvider] 이미 처리한 알림, 무시:', notificationId);
        }
        return;
      }

      // ID 추가 및 메모리 관리
      handledNotificationIdsRef.current.add(notificationId);
      if (handledNotificationIdsRef.current.size > MAX_TRACKED_IDS) {
        const idsArray = Array.from(handledNotificationIdsRef.current);
        handledNotificationIdsRef.current = new Set(idsArray.slice(-25));
      }

      const data = response.notification.request.content.data;
      handleNotification(data, {
        navigationRef: navigationRef,
        onLogout: signOutRef.current,
      });
    });

    return () => subscription.remove();
  }, []); // 마운트 시 한 번만 등록

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
