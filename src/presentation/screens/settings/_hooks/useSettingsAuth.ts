/**
 * useSettingsAuth - 설정 화면 인증 관련 로직 훅
 *
 * 로그아웃, 회원탈퇴, 네비게이션 리셋 등 인증 관련 비즈니스 로직을 관리합니다.
 *
 * @example
 * const { isWithdrawing, handleLogoutPress, handleWithdrawPress } = useSettingsAuth();
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { Linking, Platform, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/shared/providers/AuthProvider';
import { usePushNotification } from '@/shared/providers/PushNotificationProvider';
import { authApi } from '@/features/auth/api/authApi';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useDialog } from '@/presentation/components/dialog';
import { analyticsService } from '@/shared/analytics';
import { openStoreUrl } from '@/shared/utils/storeUtils';
import { appConfigApi } from '@/features/app-config/api/appConfigApi';

// 외부 URL 상수
const FEEDBACK_URL = 'https://soonsak.featurebase.app/en/p/pideubaegi-pilyohaeyo';
const PRIVACY_URL = 'https://www.notion.so/318e38e37ca0803a910ec2afbcd96890';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseSettingsAuthReturn {
  /** 로그인 상태 */
  isLoggedIn: boolean;
  /** 회원탈퇴 처리 중 여부 */
  isWithdrawing: boolean;
  /** 알림 활성화 상태 */
  isNotificationEnabled: boolean;
  /** 알림 설정 변경 핸들러 */
  handleNotificationToggle: (value: boolean) => void;
  /** 로그아웃 버튼 클릭 핸들러 */
  handleLogoutPress: () => Promise<void>;
  /** 회원탈퇴 버튼 클릭 핸들러 */
  handleWithdrawPress: () => Promise<void>;
  /** 피드백 URL 열기 */
  openFeedbackUrl: () => Promise<void>;
  /** 개인정보 URL 열기 */
  openPrivacyUrl: () => Promise<void>;
  /** 앱스토어 URL 열기 */
  openAppStoreUrl: () => Promise<void>;
  /** 관리자 화면 네비게이션 */
  navigateToAdmin: (screen: keyof RootStackParamList) => void;
}

export function useSettingsAuth(): UseSettingsAuthReturn {
  const navigation = useNavigation<NavigationProp>();
  const { signOut, status } = useAuth();
  const isLoggedIn = status === 'authenticated';
  const { showDialog, showConfirmDialog } = useDialog();
  const { refreshToken } = usePushNotification();

  // 상태
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 시스템 알림 권한 상태 체크
  const checkNotificationPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsNotificationEnabled(status === 'granted');
    return status === 'granted';
  }, []);

  // 초기 권한 상태 로드 및 앱 복귀 시 권한 재체크
  useEffect(() => {
    checkNotificationPermission();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const granted = await checkNotificationPermission();
        // 권한이 granted로 변경되었으면 푸시 토큰 재획득
        if (granted) {
          await refreshToken();
        }
      }
    });

    return () => subscription.remove();
  }, [checkNotificationPermission, refreshToken]);

  // 시스템 설정 화면 열기
  const openSystemSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  }, []);

  // 서버 스토어 URL 참조
  const storeUrlRef = useRef<string | null>(null);

  // 스토어 URL 조회
  useEffect(() => {
    appConfigApi.getVersionPolicy().then((policy) => {
      storeUrlRef.current = policy?.storeUrl ?? null;
    });
  }, []);

  // 로그인 화면으로 네비게이션 리셋
  const resetToLoginScreen = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: routePages.login }],
    });
  }, [navigation]);

  // 알림 설정 변경 핸들러 - 시스템 설정으로 이동
  const handleNotificationToggle = useCallback(
    (value: boolean) => {
      // 알림 토글 이벤트 로깅
      analyticsService.settingsNotificationToggle({
        enabled: value,
      });

      openSystemSettings();
    },
    [openSystemSettings],
  );

  // 외부 URL 열기 공통 핸들러
  const openExternalUrl = useCallback(
    async (url: string, errorMessage: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        await showDialog({
          title: '오류',
          description: errorMessage,
          buttonText: '확인',
        });
      }
    },
    [showDialog],
  );

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      await signOut();

      // logout 이벤트 로깅
      analyticsService.logout();

      resetToLoginScreen();
    } catch {
      await showDialog({
        title: '오류',
        description: '로그아웃 중 문제가 생겼어요',
        buttonText: '확인',
      });
    }
  }, [signOut, resetToLoginScreen, showDialog]);

  // 로그아웃 확인 다이얼로그
  const handleLogoutPress = useCallback(async () => {
    const result = await showConfirmDialog({
      title: '로그아웃',
      description: '정말 로그아웃할까요?',
      leftButtonText: '취소',
      rightButtonText: '로그아웃',
    });
    if (result === 'right') {
      await handleLogout();
    }
  }, [handleLogout, showConfirmDialog]);

  // 회원탈퇴 처리
  const handleWithdraw = useCallback(async () => {
    if (isWithdrawing) return;

    setIsWithdrawing(true);
    try {
      await authApi.withdrawUser();

      // account_delete 이벤트 로깅
      analyticsService.accountDelete();

      resetToLoginScreen();
    } catch {
      await showDialog({
        title: '오류',
        description: '탈퇴하는 중 문제가 생겼어요',
        buttonText: '확인',
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [isWithdrawing, resetToLoginScreen, showDialog]);

  // 회원탈퇴 확인 다이얼로그
  const handleWithdrawPress = useCallback(async () => {
    const result = await showConfirmDialog({
      title: '회원탈퇴',
      description: '정말 탈퇴할까요?\n탈퇴하면 모든 데이터가 삭제되고 복구할 수 없어요',
      leftButtonText: '취소',
      rightButtonText: '탈퇴하기',
    });
    if (result === 'right') {
      await handleWithdraw();
    }
  }, [handleWithdraw, showConfirmDialog]);

  // 외부 URL 열기 함수들
  const openFeedbackUrl = useCallback(() => {
    // 피드백 클릭 이벤트 로깅
    analyticsService.settingsFeedbackClick();
    return openExternalUrl(FEEDBACK_URL, '메일 앱을 열 수 없습니다.');
  }, [openExternalUrl]);

  const openPrivacyUrl = useCallback(() => {
    // 개인정보 클릭 이벤트 로깅
    analyticsService.settingsPrivacyClick();
    return openExternalUrl(PRIVACY_URL, '페이지를 열 수 없습니다.');
  }, [openExternalUrl]);

  const openAppStoreUrl = useCallback(async () => {
    // 앱 평가 클릭 이벤트 로깅
    analyticsService.settingsRateAppClick();

    // 서버 URL 우선, 없으면 플랫폼별 기본 URL 사용
    const success = await openStoreUrl(storeUrlRef.current);
    if (!success) {
      await showDialog({
        title: '오류',
        description: '스토어를 열 수 없습니다.',
        buttonText: '확인',
      });
    }
  }, [showDialog]);

  // 관리자 화면 네비게이션
  const navigateToAdmin = useCallback(
    (screen: keyof RootStackParamList) => {
      navigation.navigate(screen as never);
    },
    [navigation],
  );

  return {
    isLoggedIn,
    isWithdrawing,
    isNotificationEnabled,
    handleNotificationToggle,
    handleLogoutPress,
    handleWithdrawPress,
    openFeedbackUrl,
    openPrivacyUrl,
    openAppStoreUrl,
    navigateToAdmin,
  };
}
