import { useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { AppSize } from '@/shared/utils/appSize';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { useAuth } from '@/shared/providers/AuthProvider';
import { onboardingStorage } from '@/features/auth/utils/onboardingStorage';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { handlePendingNavigation, pendingNavigationStore } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
import { LoginBackground } from './_components/LoginBackground';
import { LoginIntroText } from './_components/LoginIntroText';
import { SocialLoginButtonGroup } from './_components/SocialLoginButtonGroup';
import { useSocialLogin } from './_hooks/useSocialLogin';
import BackArrowIcon from '@assets/icons/back_arrow.svg';
import type { AuthState } from '@/features/auth/types';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, typeof routePages.login>;
type LoginRouteProp = RouteProp<RootStackParamList, typeof routePages.login>;

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

/**
 * LoginScreen - 로그인 페이지
 *
 * 소셜 로그인(카카오, Google, Apple)을 제공하는 로그인 화면입니다.
 * Flutter Plotz 디자인을 기반으로 구현되었습니다.
 *
 * 구성:
 * - 배경 이미지 + 상단/하단 그래디언트
 * - 인트로 텍스트 (SVG)
 * - 소셜 로그인 버튼 그룹
 *
 * @example
 * // StackNavigator에서 사용
 * <Stack.Screen name="Login" component={LoginScreen} />
 */
export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const { handleLogin, loadingProvider } = useSocialLogin();

  // canGoBack 파라미터 확인 (다른 화면에서 로그인 페이지로 이동한 경우 true)
  const canGoBack = route.params?.canGoBack ?? false;

  // 이전 인증 상태 추적 (로그인 성공 감지용)
  const prevStatusRef = useRef<AuthState['status']>(status);

  // 로그인 화면 unmount 시 pending navigation 초기화
  // (제스처 뒤로가기, 하드웨어 버튼 등 모든 이탈 케이스 커버)
  // 로그인 성공 시에는 handlePendingNavigation에서 이미 clear됨
  useEffect(() => {
    return () => {
      pendingNavigationStore.clear();
    };
  }, []);

  // 메인 화면으로 이동 (온보딩 완료 표시 후)
  const navigateToMain = useCallback(async () => {
    await onboardingStorage.markCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: routePages.mainTabs }],
    });
  }, [navigation]);

  // onLoginSuccess 콜백 (찜/평점 등 pending 액션 실행용)
  const onLoginSuccess = route.params?.onLoginSuccess;

  // 로그인 성공 시 처리 (상태가 authenticated로 '변경'된 경우에만)
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // 상태가 authenticated로 '변경'된 경우에만 처리 (로그인 성공)
    // 이미 authenticated 상태로 페이지에 도착한 경우는 무시 (로그아웃/탈퇴 후 레이스 컨디션)
    const justAuthenticated = prevStatus !== 'authenticated' && status === 'authenticated';

    if (justAuthenticated) {
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
  }, [status, canGoBack, navigation, navigateToMain, onLoginSuccess]);

  // 비회원 둘러보기 처리
  // (pending clear는 unmount useEffect에서 처리)
  const handleGuestPress = useCallback(() => {
    if (canGoBack) {
      navigation.goBack();
    } else {
      navigateToMain();
    }
  }, [canGoBack, navigation, navigateToMain]);

  // 뒤로가기 처리
  // (pending clear는 unmount useEffect에서 처리)
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <Container>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* 배경 이미지 + 그래디언트 */}
      <LoginBackground />

      {/* 뒤로가기 버튼 (canGoBack일 때만 표시) */}
      {canGoBack && (
        <BackButtonContainer style={{ top: insets.top + AppSize.ratioHeight(8) }}>
          <TouchableOpacity onPress={handleGoBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon width={24} height={24} color={colors.white} />
          </TouchableOpacity>
        </BackButtonContainer>
      )}

      {/* 콘텐츠 영역 */}
      <ContentContainer style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}>
        {/* 상단 인트로 텍스트 */}
        <TopSection>
          <LoginIntroText />
        </TopSection>

        {/* 하단 로그인 버튼 그룹 */}
        <BottomSection>
          <SocialLoginButtonGroup onLogin={handleLogin} loadingProvider={loadingProvider} />
          <GuestButton onPress={handleGuestPress} activeOpacity={0.7}>
            <GuestButtonText>비회원으로 둘러보기</GuestButtonText>
          </GuestButton>
        </BottomSection>
      </ContentContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
});

const BackButtonContainer = styled.View({
  position: 'absolute',
  left: AppSize.ratioWidth(16),
  zIndex: 10,
});

const ContentContainer = styled.View({
  flex: 1,
  justifyContent: 'space-between',
  paddingHorizontal: 24,
});

const TopSection = styled.View({
  // 상단 인트로 영역
});

const BottomSection = styled.View({
  // 하단 버튼 영역
});

const GuestButton = styled(TouchableOpacity)({
  marginTop: 24,
  alignItems: 'center',
});

const GuestButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  textDecorationLine: 'underline',
});
