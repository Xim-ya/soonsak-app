/**
 * useLoginNavigation - 로그인 화면 네비게이션 로직
 *
 * 로그인 성공/실패 시 네비게이션 처리와 관련된 모든 로직을 캡슐화합니다.
 * - 로그인 성공 감지 및 화면 전환
 * - 비회원 둘러보기 처리
 * - 뒤로가기 처리
 * - Pending navigation 관리 (푸시/딥링크)
 *
 * @example
 * const { canGoBack, handleGoBack, handleGuestPress } = useLoginNavigation();
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/providers/AuthProvider';
import { onboardingStorage } from '@/features/auth/utils/onboardingStorage';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { handlePendingNavigation, pendingNavigationStore } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
import type { AuthState } from '@/features/auth/types';
import { analyticsService, LoginReferrer } from '@/shared/analytics';
import { useSocialLogin } from './useSocialLogin';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, typeof routePages.login>;
type LoginRouteProp = RouteProp<RootStackParamList, typeof routePages.login>;

interface UseLoginNavigationReturn {
  /** SafeArea insets */
  insets: ReturnType<typeof useSafeAreaInsets>;
  /** 뒤로가기 가능 여부 (다른 화면에서 로그인으로 이동한 경우 true) */
  canGoBack: boolean;
  /** 현재 로딩 중인 소셜 로그인 provider */
  loadingProvider: ReturnType<typeof useSocialLogin>['loadingProvider'];
  /** 소셜 로그인 핸들러 */
  handleLogin: ReturnType<typeof useSocialLogin>['handleLogin'];
  /** 뒤로가기 핸들러 */
  handleGoBack: () => void;
  /** 비회원 둘러보기 핸들러 */
  handleGuestPress: () => void;
}

export function useLoginNavigation(): UseLoginNavigationReturn {
  const navigation = useNavigation<LoginNavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const insets = useSafeAreaInsets();
  const { status, needsProfileSetup } = useAuth();

  // canGoBack 파라미터 확인 (다른 화면에서 로그인 페이지로 이동한 경우 true)
  const canGoBack = route.params?.canGoBack ?? false;

  // referrerScreen 파라미터 (GA 로깅용)
  const referrerScreen = route.params?.referrerScreen ?? LoginReferrer.INITIAL;

  const { handleLogin, loadingProvider } = useSocialLogin(referrerScreen);

  // 이전 인증 상태 추적 (로그인 성공 감지용)
  const prevStatusRef = useRef<AuthState['status']>(status);

  // onLoginSuccess 콜백 (찜/평점 등 pending 액션 실행용)
  const onLoginSuccess = route.params?.onLoginSuccess;

  // login_start 이벤트 로깅 (화면 진입 시 1회)
  useEffect(() => {
    analyticsService.loginStart({
      referrer_screen: referrerScreen,
      can_go_back: canGoBack,
    });
  }, []);

  // 메인 화면으로 이동 (온보딩 완료 표시 후)
  const navigateToMain = useCallback(async () => {
    await onboardingStorage.markCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: routePages.mainTabs }],
    });
  }, [navigation]);

  // 로그인 화면 unmount 시 pending navigation 초기화
  // (제스처 뒤로가기, 하드웨어 버튼 등 모든 이탈 케이스 커버)
  useEffect(() => {
    return () => {
      pendingNavigationStore.clear();
    };
  }, []);

  // 로그인 성공 시 처리 (상태가 authenticated로 '변경'된 경우에만)
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // 상태가 authenticated로 '변경'된 경우에만 처리 (로그인 성공)
    // 이미 authenticated 상태로 페이지에 도착한 경우는 무시
    const justAuthenticated = prevStatus !== 'authenticated' && status === 'authenticated';

    if (justAuthenticated) {
      // 신규 사용자면 메인으로 리셋 후 프로필 설정 화면으로 이동
      // (프로필 설정 완료 시 goBack()하면 메인으로 이동하도록)
      if (needsProfileSetup) {
        navigation.reset({
          index: 1,
          routes: [
            { name: routePages.mainTabs },
            { name: routePages.profileSetup, params: { mode: 'initial' } },
          ],
        });
        return;
      }

      // 푸시 알림/딥링크로 인한 pending navigation이 있으면 해당 화면으로 이동
      if (navigationRef.isReady() && handlePendingNavigation(navigationRef)) {
        return;
      }

      // 로그인 성공 콜백 실행 (찜/평점 등)
      onLoginSuccess?.();

      if (canGoBack) {
        // 다른 화면에서 로그인 페이지로 왔으면 뒤로가기
        navigation.goBack();
      } else {
        // 최초 설치 또는 회원탈퇴 후면 메인으로 이동
        navigateToMain();
      }
    }
  }, [status, needsProfileSetup, canGoBack, navigation, navigateToMain, onLoginSuccess]);

  // 비회원 둘러보기 처리
  const handleGuestPress = useCallback(() => {
    // login_skip 이벤트 로깅
    analyticsService.loginSkip({
      referrer_screen: referrerScreen,
    });

    if (canGoBack) {
      navigation.goBack();
    } else {
      navigateToMain();
    }
  }, [canGoBack, navigation, navigateToMain, referrerScreen]);

  // 뒤로가기 처리
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    insets,
    canGoBack,
    loadingProvider,
    handleLogin,
    handleGoBack,
    handleGuestPress,
  };
}
