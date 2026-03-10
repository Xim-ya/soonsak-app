/**
 * usePushNotifications - Expo 푸시 알림 관리 훅
 *
 * Expo Push Token 획득, 권한 요청, 알림 수신 리스너를 관리합니다.
 * - 실제 디바이스에서만 동작 (에뮬레이터 지원 안 함)
 * - Android 13+에서는 POST_NOTIFICATIONS 런타임 권한 필요
 * - SDK 53+에서는 Development Build 필수 (Expo Go 지원 안 함)
 *
 * @example
 * const { expoPushToken, notification, requestPermissions } = usePushNotifications();
 *
 * // 토큰이 있으면 서버에 등록
 * useEffect(() => {
 *   if (expoPushToken && user) {
 *     syncPushToken(user.id, expoPushToken);
 *   }
 * }, [expoPushToken, user]);
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { PushLogger } from '@/core/utils';

/** 시뮬레이터 여부 확인 */
const isSimulator = !Device.isDevice;

// 전역 알림 핸들러 설정 (Foreground 알림 표시 방식)
// 시뮬레이터에서는 NativeEventEmitter 초기화 에러 방지를 위해 스킵
if (!isSimulator) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** 푸시 알림 훅 반환 타입 */
export interface UsePushNotificationsResult {
  /** Expo Push Token (ExponentPushToken[...] 형식) */
  expoPushToken: string | null;
  /** 현재 수신된 알림 (Foreground) */
  notification: Notifications.Notification | null;
  /** 권한 상태 */
  permissionStatus: Notifications.PermissionStatus | null;
  /** 푸시 알림 초기화 (권한 요청 + 토큰 획득) - 로그인 시 호출 */
  initialize: () => Promise<string | null>;
  /** 푸시 알림 권한 요청 */
  requestPermissions: () => Promise<boolean>;
  /** 푸시 토큰 재획득 (권한 허용 후 토큰이 없을 때 사용) */
  refreshToken: () => Promise<string | null>;
  /** 초기화 완료 여부 */
  isInitialized: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * Expo Push Token 획득 함수
 *
 * Android에서는 알림 채널을 먼저 생성하고, 권한을 확인한 후 토큰을 획득합니다.
 */
async function getExpoPushToken(): Promise<string | null> {
  // 시뮬레이터에서는 푸시 토큰 획득 불가 (iOS 제한)
  if (isSimulator) {
    PushLogger.log('시뮬레이터에서는 푸시 토큰을 획득할 수 없습니다.');
    return null;
  }

  // Android: 알림 채널 생성 (Android 8.0+ 필수)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C853',
    });
  }

  // Project ID 획득
  const projectId =
    Constants?.expoConfig?.extra?.['eas']?.projectId ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    PushLogger.error('EAS Project ID를 찾을 수 없습니다.');
    return null;
  }

  // 토큰 획득
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    PushLogger.error('토큰 획득 실패:', error);
    return null;
  }
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null,
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription>(undefined);
  const initializingRef = useRef(false);
  // 알림 탭 응답은 PushNotificationProvider에서 처리 (중복 방지)

  // 권한 요청 함수
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        setPermissionStatus(existingStatus);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('푸시 알림 권한이 필요해요');
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '권한 요청 실패';
      setError(message);
      return false;
    }
  }, []);

  // 토큰 재획득 함수 (권한 허용 후 토큰이 없을 때 사용)
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // 이미 토큰이 있으면 그대로 반환
    if (expoPushToken) return expoPushToken;

    // 권한 확인
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    // 토큰 획득
    const token = await getExpoPushToken();
    if (token) {
      setExpoPushToken(token);
      PushLogger.log('토큰 재획득:', token);
    }
    return token;
  }, [expoPushToken]);

  // ⚡️ 최적화: 명시적 초기화 함수 (로그인 시점에 호출)
  // 앱 시작 시 자동 초기화 대신, 로그인 시점에 호출하여 초기화 속도 향상
  const initialize = useCallback(async (): Promise<string | null> => {
    // 이미 초기화 완료된 경우 (토큰 획득 성공한 경우만)
    if (isInitialized) {
      PushLogger.log('Push 이미 초기화됨');
      return expoPushToken;
    }

    // 동시 호출 방지 (initializingRef만 체크하여 재시도 허용)
    if (initializingRef.current) {
      PushLogger.log('Push 초기화 진행 중');
      return expoPushToken;
    }

    initializingRef.current = true;
    PushLogger.log('Push 초기화 시작');

    try {
      // 1. 권한 확인 및 요청
      const granted = await requestPermissions();
      if (!granted) {
        PushLogger.log('Push 권한 거부됨 - 나중에 재시도 가능');
        // 권한 거부 시 isInitialized를 설정하지 않아 재시도 가능
        return null;
      }

      // 2. 토큰 획득 (시뮬레이터에서는 스킵)
      if (isSimulator) {
        PushLogger.log('시뮬레이터: 권한 획득 완료, 토큰 스킵');
        // 시뮬레이터에서는 성공으로 간주
        setIsInitialized(true);
        return null;
      }

      const token = await getExpoPushToken();
      if (token) {
        setExpoPushToken(token);
        PushLogger.log('Expo Push Token:', token);
        // 토큰 획득 성공 시에만 초기화 완료로 표시
        setIsInitialized(true);
      } else {
        PushLogger.log('토큰 획득 실패 - 나중에 재시도 가능');
        // 토큰 획득 실패 시 isInitialized를 설정하지 않아 재시도 가능
      }

      return token;
    } finally {
      initializingRef.current = false;
    }
  }, [requestPermissions, isInitialized, expoPushToken]);

  // Foreground 알림 수신 리스너만 등록 (권한 요청 없이)
  useEffect(() => {
    let mounted = true;

    PushLogger.log('훅 초기화, isSimulator:', isSimulator);

    // Foreground 알림 수신 리스너 (알림 표시용)
    // 시뮬레이터에서는 NativeEventEmitter 에러 방지를 위해 스킵
    if (!isSimulator) {
      notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
        if (mounted) {
          setNotification(notif);
          PushLogger.log('Foreground 알림 수신:', notif.request.content.title);
        }
      });
    }

    // 알림 탭 응답은 PushNotificationProvider에서 처리 (인증 체크 포함)

    return () => {
      mounted = false;
      notificationListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    initialize,
    requestPermissions,
    refreshToken,
    isInitialized,
    error,
  };
}
