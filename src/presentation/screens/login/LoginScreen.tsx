import { TouchableOpacity, StatusBar } from 'react-native';
import styled from '@emotion/native';
import { AppSize } from '@/shared/utils/appSize';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { LoginBackground } from './_components/LoginBackground';
import { LoginIntroText } from './_components/LoginIntroText';
import { SocialLoginButtonGroup } from './_components/SocialLoginButtonGroup';
import { useLoginNavigation } from './_hooks/useLoginNavigation';
import BackArrowIcon from '@assets/icons/back_arrow.svg';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

/**
 * LoginScreen - 로그인 페이지
 *
 * 소셜 로그인(카카오, Google, Apple)을 제공하는 로그인 화면입니다.
 *
 * 구성:
 * - 배경 이미지 + 상단/하단 그래디언트
 * - 인트로 텍스트 (SVG)
 * - 소셜 로그인 버튼 그룹
 */
export default function LoginScreen() {
  const { insets, canGoBack, loadingProvider, handleLogin, handleGoBack, handleGuestPress } =
    useLoginNavigation();

  return (
    <Container>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LoginBackground />

      {canGoBack && (
        <BackButtonContainer style={{ top: insets.top + AppSize.ratioHeight(8) }}>
          <TouchableOpacity onPress={handleGoBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon width={24} height={24} color={colors.white} />
          </TouchableOpacity>
        </BackButtonContainer>
      )}

      <ContentContainer style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}>
        <TopSection>
          <LoginIntroText />
        </TopSection>

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

const TopSection = styled.View({});

const BottomSection = styled.View({});

const GuestButton = styled(TouchableOpacity)({
  marginTop: 24,
  alignItems: 'center',
});

const GuestButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  textDecorationLine: 'underline',
});
