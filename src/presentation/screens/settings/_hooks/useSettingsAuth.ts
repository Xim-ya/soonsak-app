/**
 * useSettingsAuth - 설정 화면 인증 관련 로직 훅
 *
 * 로그아웃, 회원탈퇴, 네비게이션 리셋 등 인증 관련 비즈니스 로직을 관리합니다.
 *
 * @example
 * const { isWithdrawing, handleLogoutPress, handleWithdrawPress } = useSettingsAuth();
 */

import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/providers/AuthProvider';
import { authApi } from '@/features/auth/api/authApi';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useDialog } from '@/presentation/components/dialog';

// 외부 URL 상수
const FEEDBACK_URL = 'mailto:support@soonsak.app';
const PRIVACY_URL = 'https://soonsak.app/privacy';
const APP_STORE_URL = 'https://apps.apple.com/app/soonsak';

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

  // 상태
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 로그인 화면으로 네비게이션 리셋
  const resetToLoginScreen = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: routePages.login }],
    });
  }, [navigation]);

  // 알림 설정 변경 핸들러
  const handleNotificationToggle = useCallback((value: boolean) => {
    setIsNotificationEnabled(value);
    // TODO: 알림 설정 저장 로직 구현
  }, []);

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
  const openFeedbackUrl = useCallback(
    () => openExternalUrl(FEEDBACK_URL, '메일 앱을 열 수 없습니다.'),
    [openExternalUrl],
  );

  const openPrivacyUrl = useCallback(
    () => openExternalUrl(PRIVACY_URL, '페이지를 열 수 없습니다.'),
    [openExternalUrl],
  );

  const openAppStoreUrl = useCallback(
    () => openExternalUrl(APP_STORE_URL, '스토어를 열 수 없습니다.'),
    [openExternalUrl],
  );

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
