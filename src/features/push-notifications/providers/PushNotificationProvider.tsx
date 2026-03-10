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
import { useQueryClient } from '@tanstack/react-query';
import { usePushNotifications } from '@/features/push-notifications/hooks/usePushNotifications';
import { pushTokenApi } from '../api/pushTokenApi';
import { handleNotification } from '../handlers/notificationHandler';
import { navigationRef } from '@/presentation/navigation/utils/navigationRef';
import { notificationKeys } from '@/features/notifications/hooks/notificationQueryKeys';
import { useAuth } from '@/features/auth/providers';
import { supabaseClient } from '@/core/api';
import {
  getOrCreateDeviceId,
  linkDeviceToUser,
  incrementDeviceEntryCount,
  getDeviceEntryInfo,
} from '@/core/utils/deviceId';
import { userApi } from '@/features/user/api/userApi';
import { PushLogger } from '@/core/utils';
import { wowPointWebhook } from '@/core/services/wowPointWebhook';

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

/** PushNotificationContext 값 타입 */
interface PushNotificationContextValue {
  /** Expo Push Token */
  expoPushToken: string | null;
  /** 현재 수신된 알림 (Foreground) */
  notification: Notifications.Notification | null;
  /** 권한 상태 */
  permissionStatus: Notifications.PermissionStatus | null;
  /** 푸시 토큰 재획득 (권한 허용 후 토큰이 없을 때 사용) */
  refreshToken: () => Promise<string | null>;
  /** 에러 메시지 */
  error: string | null;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { status, user, signOut, displayName } = useAuth();
  const queryClient = useQueryClient();
  const { expoPushToken, notification, permissionStatus, initialize, refreshToken, error } =
    usePushNotifications();
  const lastSyncedRef = useRef<{ userId: string; token: string } | null>(null);
  const hasInitializedPushRef = useRef(false);

  // Killed 상태에서 시작 시 사용할 signOut 캡처
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  // 최신 user 상태 참조 (이벤트 리스너에서 사용)
  const userRef = useRef(user);
  userRef.current = user;

  // 최신 expoPushToken 참조 (이벤트 리스너에서 사용)
  const expoPushTokenRef = useRef(expoPushToken);
  expoPushTokenRef.current = expoPushToken;

  // 이미 처리한 알림 응답 ID 추적 (중복 처리 방지)
  // Set을 사용하여 연속 알림(A → B → A) 시나리오도 처리
  const handledNotificationIdsRef = useRef<Set<string>>(new Set());
  const MAX_TRACKED_IDS = 50; // 메모리 관리를 위한 최대 추적 수

  // 앱 시작 시 디바이스 등록 (비로그인 유저 트래킹 용도)
  useEffect(() => {
    const registerDevice = async () => {
      try {
        await getOrCreateDeviceId();
        PushLogger.log('디바이스 등록 완료');
      } catch (error) {
        PushLogger.error('디바이스 등록 실패:', error);
      }
    };

    registerDevice();
  }, []); // 마운트 시 한 번만 실행

  // ⚡️ 최적화: 최초 로그인 시 Push 초기화 (앱 시작 시 대신 로그인 시점에 실행)
  // 이렇게 하면 앱 초기화 속도가 향상되고, 비로그인 유저에게 불필요한 권한 요청을 피함
  useEffect(() => {
    // 로그아웃 시 초기화 플래그 리셋 (재로그인 시 다시 초기화 가능하도록)
    if (status !== 'authenticated') {
      hasInitializedPushRef.current = false;
      return;
    }
    // 이미 초기화했으면 스킵
    if (hasInitializedPushRef.current) return;

    const initializePush = async () => {
      PushLogger.log('로그인 감지 - Push 초기화 시작');
      hasInitializedPushRef.current = true;
      await initialize();
    };

    initializePush();
  }, [status, initialize]);

  // 푸시 알림 수신 시 읽지 않은 알림 개수 캐시 무효화 (벨 뱃지 & 앱 뱃지 갱신)
  useEffect(() => {
    if (notification && user) {
      PushLogger.log('알림 수신 - 캐시 무효화');
      // 읽지 않은 알림 개수 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(user.id, expoPushToken),
      });
      // 알림 목록 캐시도 무효화 (새 알림 표시)
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(user.id, expoPushToken),
      });
    }
  }, [notification, user, expoPushToken, queryClient]);

  // 앱 진입 카운트 증가 (status 확정 후 한 번만 실행)
  const hasCountedRef = useRef(false);
  useEffect(() => {
    // status가 아직 idle이면 대기
    if (status === 'idle') return;
    // 이미 카운트했으면 무시
    if (hasCountedRef.current) return;

    PushLogger.log('========== 앱 진입 감지 ==========');
    PushLogger.log('Auth Status:', status);

    const incrementEntryCount = async () => {
      try {
        const isLoggedIn = status === 'authenticated' && !!user;
        let entryInfo: { entryCount: number; lastVisitAt: string | null } | null = null;

        if (isLoggedIn && user) {
          // 로그인 유저: 진입 정보 조회 (카운트 증가 전)
          entryInfo = await userApi.getEntryInfo(user.id);

          // 로그인 유저: profiles.entry_count 증가 + 앱 버전 업데이트
          await Promise.all([
            userApi.incrementEntryCount(user.id),
            userApi.updateLastUsedVersion(user.id),
          ]);
        } else {
          // 비로그인 유저: 진입 정보 조회 (카운트 증가 전)
          entryInfo = await getDeviceEntryInfo();

          // 비로그인 유저: devices.entry_count 증가
          await incrementDeviceEntryCount();
        }

        // 앱 진입 웹훅 호출 (Slack 알림)
        wowPointWebhook.onAppEntry({
          nickname: displayName,
          isLoggedIn,
          ...(entryInfo && { visitCount: entryInfo.entryCount + 1 }),
          ...(entryInfo?.lastVisitAt && { lastVisitAt: entryInfo.lastVisitAt }),
        });

        hasCountedRef.current = true;
        PushLogger.log('================================');
      } catch (error) {
        PushLogger.error('진입 카운트 증가 실패:', error);
      }
    };

    incrementEntryCount();
  }, [status, user, displayName]);

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
          PushLogger.log('이미 처리한 알림, 무시:', notificationId);
          return;
        }

        // ID 추가 및 메모리 관리
        handledNotificationIdsRef.current.add(notificationId);
        if (handledNotificationIdsRef.current.size > MAX_TRACKED_IDS) {
          const idsArray = Array.from(handledNotificationIdsRef.current);
          handledNotificationIdsRef.current = new Set(idsArray.slice(-25));
        }

        const data = response.notification.request.content.data;

        // 푸시 클릭 추적 및 캐시 무효화
        const dbNotificationId = extractNotificationId(data);
        const currentUser = userRef.current;
        const currentToken = expoPushTokenRef.current;

        if (currentUser?.id) {
          // 읽음 처리 완료 후 캐시 refetch (순서 중요)
          if (dbNotificationId) {
            try {
              await pushTokenApi.trackNotificationClick(dbNotificationId, currentUser.id);
            } catch {
              // 읽음 처리 실패해도 계속 진행
            }
          }
          // 읽음 처리 완료 후 즉시 refetch (뱃지 카운트 갱신)
          // invalidateQueries 대신 refetchQueries로 즉시 데이터 갱신 보장
          await queryClient.refetchQueries({
            queryKey: notificationKeys.unreadCount(currentUser.id, currentToken),
          });
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
          PushLogger.error('navigationRef 준비 타임아웃 - 알림 처리 실패');
        }
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, [status, queryClient]); // status가 idle에서 변경될 때 실행

  // 앱이 실행 중일 때 푸시 알림 탭 처리
  // ref 패턴으로 최신 상태 참조 (구독 재등록 방지)
  useEffect(() => {
    // 시뮬레이터에서는 NativeEventEmitter 에러 방지를 위해 스킵
    if (isSimulator) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (!navigationRef.isReady()) {
        PushLogger.warn('navigationRef가 준비되지 않음');
        return;
      }

      // 알림 응답 ID로 중복 처리 방지
      const notificationId = response.notification.request.identifier;
      if (handledNotificationIdsRef.current.has(notificationId)) {
        PushLogger.log('이미 처리한 알림, 무시:', notificationId);
        return;
      }

      // ID 추가 및 메모리 관리
      handledNotificationIdsRef.current.add(notificationId);
      if (handledNotificationIdsRef.current.size > MAX_TRACKED_IDS) {
        const idsArray = Array.from(handledNotificationIdsRef.current);
        handledNotificationIdsRef.current = new Set(idsArray.slice(-25));
      }

      const data = response.notification.request.content.data;
      const currentUser = userRef.current;
      const currentToken = expoPushTokenRef.current;

      // 푸시 클릭 추적 및 캐시 무효화
      const dbNotificationId = extractNotificationId(data);

      if (__DEV__) {
        // 디버깅: 푸시 클릭 시 받은 data 확인
        console.log('[PushClick] data:', JSON.stringify(data, null, 2));

        // 디버깅: Supabase 세션 상태 확인
        const { data: sessionData } = await supabaseClient.auth.getSession();
        console.log('[PushClick] Supabase session:', sessionData?.session?.user?.id ?? 'NO SESSION');
        console.log('[PushClick] extracted _notificationId:', dbNotificationId);
      }

      if (currentUser?.id) {
        // 읽음 처리 완료 후 캐시 refetch (순서 중요: await로 읽음 처리 완료 대기)
        if (dbNotificationId) {
          try {
            await pushTokenApi.trackNotificationClick(dbNotificationId, currentUser.id);
          } catch {
            // 읽음 처리 실패해도 계속 진행
          }
        }

        // 읽음 처리 완료 후 즉시 refetch (뱃지 카운트 갱신)
        // invalidateQueries 대신 refetchQueries로 즉시 데이터 갱신 보장
        await queryClient.refetchQueries({
          queryKey: notificationKeys.unreadCount(currentUser.id, currentToken),
        });
      }

      handleNotification(data, {
        navigationRef: navigationRef,
        onLogout: signOutRef.current,
      });
    });

    return () => subscription.remove();
  }, [queryClient]); // queryClient는 변경되지 않음

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
        PushLogger.log('토큰 동기화 완료');
      } catch (err) {
        PushLogger.error('토큰 동기화 실패:', err);
      }
    };

    syncToken();
  }, [status, user, expoPushToken]);

  const value: PushNotificationContextValue = {
    expoPushToken,
    notification,
    permissionStatus,
    refreshToken,
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
