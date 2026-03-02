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
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';
import { pushTokenApi, handleNotification } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
import { useAuth } from './AuthProvider';

/** 시뮬레이터 여부 확인 */
const isSimulator = !Device.isDevice;

/** 푸시 데이터에서 notificationId 추출 */
function extractNotificationId(data: unknown): string | null {
  if (data && typeof data === 'object' && '_notificationId' in data) {
    const id = (data as { _notificationId?: unknown })._notificationId;
    return typeof id === 'string' ? id : null;
  }
  return null;
}
import {
  getOrCreateDeviceId,
  linkDeviceToUser,
  incrementDeviceEntryCount,
} from '@/shared/utils/deviceId';
import { userApi } from '@/features/user/api/userApi';

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
  const lastSyncedRef = useRef<{ userId: string; token: string } | null>(null);

  // Killed 상태에서 시작 시 사용할 signOut 캡처
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  // 최신 user 상태 참조 (이벤트 리스너에서 사용)
  const userRef = useRef(user);
  userRef.current = user;

  // 이미 처리한 알림 응답 ID 추적 (중복 처리 방지)
  // Set을 사용하여 연속 알림(A → B → A) 시나리오도 처리
  const handledNotificationIdsRef = useRef<Set<string>>(new Set());
  const MAX_TRACKED_IDS = 50; // 메모리 관리를 위한 최대 추적 수

  // 앱 시작 시 디바이스 등록 (비로그인 유저 트래킹 용도)
  useEffect(() => {
    const registerDevice = async () => {
      try {
        await getOrCreateDeviceId();
        if (__DEV__) {
          console.log('[PushNotificationProvider] 디바이스 등록 완료');
        }
      } catch (error) {
        console.error('[PushNotificationProvider] 디바이스 등록 실패:', error);
      }
    };

    registerDevice();
  }, []); // 마운트 시 한 번만 실행

  // 앱 진입 카운트 증가 (status 확정 후 한 번만 실행)
  const hasCountedRef = useRef(false);
  useEffect(() => {
    // status가 아직 idle이면 대기
    if (status === 'idle') return;
    // 이미 카운트했으면 무시
    if (hasCountedRef.current) return;

    console.log('[EntryCount] ========== 앱 진입 감지 ==========');
    console.log('[EntryCount] Auth Status:', status);

    const incrementEntryCount = async () => {
      try {
        if (status === 'authenticated' && user) {
          // 로그인 유저: profiles.entry_count 증가
          await userApi.incrementEntryCount(user.id);
        } else {
          // 비로그인 유저: devices.entry_count 증가
          await incrementDeviceEntryCount();
        }
        hasCountedRef.current = true;
        console.log('[EntryCount] ================================');
      } catch (error) {
        console.error('[EntryCount] 진입 카운트 증가 실패:', error);
      }
    };

    incrementEntryCount();
  }, [status, user]);

  // 앱이 종료 상태(Killed)에서 푸시 알림으로 시작된 경우 처리
  // status가 idle이면 AuthProvider 세션 복원이 완료되지 않았으므로 대기
  useEffect(() => {
    // AuthProvider 초기화 대기
    if (status === 'idle') return;

    // 시뮬레이터에서는 NativeEventEmitter 에러 방지를 위해 스킵
    if (isSimulator) return;

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

        // 푸시 클릭 추적 (비동기, 실패해도 무시)
        const dbNotificationId = extractNotificationId(data);
        if (dbNotificationId && user?.id) {
          pushTokenApi.trackNotificationClick(dbNotificationId, user.id);
        }

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
    // 시뮬레이터에서는 NativeEventEmitter 에러 방지를 위해 스킵
    if (isSimulator) return;

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

      // 푸시 클릭 추적 (비동기, 실패해도 무시)
      const dbNotificationId = extractNotificationId(data);
      if (dbNotificationId && userRef.current?.id) {
        pushTokenApi.trackNotificationClick(dbNotificationId, userRef.current.id);
      }

      handleNotification(data, {
        navigationRef: navigationRef,
        onLogout: signOutRef.current,
      });
    });

    return () => subscription.remove();
  }, []); // 마운트 시 한 번만 등록

  // 로그인 상태 + 토큰 변경 시 서버 동기화
  useEffect(() => {
    // 로그아웃 시 ref 초기화
    if (status !== 'authenticated') {
      lastSyncedRef.current = null;
      return;
    }

    // 동기화 조건: 유저 존재 + 토큰 존재 + (토큰 또는 유저가 변경됨)
    const shouldSync =
      user &&
      expoPushToken &&
      (lastSyncedRef.current?.token !== expoPushToken || lastSyncedRef.current?.userId !== user.id);

    if (!shouldSync) return;

    const syncToken = async () => {
      try {
        // 디바이스를 유저에 연결 (devices 테이블 업데이트)
        await linkDeviceToUser(user.id);

        // 푸시 토큰 동기화 (push_tokens 테이블)
        await pushTokenApi.syncToken(user.id, expoPushToken);
        lastSyncedRef.current = { userId: user.id, token: expoPushToken };
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
