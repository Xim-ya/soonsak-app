import styled from '@emotion/native';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import textStyles from '@/shared/styles/textStyles';
import type { SocialProvider } from '@/features/auth/types';
import { SOCIAL_LOGIN_CONFIG } from '@/features/auth/constants/authConstants';

// 소셜 로고 아이콘 import
import KakaoLogo from '@assets/icons/kakao_logo.svg';
import GoogleLogo from '@assets/icons/google_logo.svg';
import AppleLogo from '@assets/icons/apple_logo.svg';

const LOGO_SIZE = 20;
const BUTTON_HEIGHT = 44;
const BUTTON_RADIUS = 4;

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * SocialLoginButton - 소셜 로그인 버튼 컴포넌트
 *
 * 프로바이더별로 다른 스타일과 로고를 표시합니다.
 * - 카카오: 노란 배경, 검정 텍스트
 * - Google: 흰 배경, 검정 텍스트
 * - Apple: 흰 배경, 검정 텍스트
 *
 * @example
 * <SocialLoginButton
 *   provider="kakao"
 *   onPress={handleKakaoLogin}
 *   isLoading={isLoading}
 * />
 */
export function SocialLoginButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
}: SocialLoginButtonProps) {
  const config = SOCIAL_LOGIN_CONFIG[provider];
  const LogoComponent = getLogoComponent(provider);

  return (
    <ButtonContainer
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      backgroundColor={config.backgroundColor}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={config.textColor} />
      ) : (
        <>
          <LogoWrapper>
            <LogoComponent width={LOGO_SIZE} height={LOGO_SIZE} />
          </LogoWrapper>
          <ButtonText textColor={config.textColor}>{config.label}</ButtonText>
        </>
      )}
    </ButtonContainer>
  );
}

/** 프로바이더별 로고 컴포넌트 반환 */
function getLogoComponent(provider: SocialProvider) {
  switch (provider) {
    case 'kakao':
      return KakaoLogo;
    case 'google':
      return GoogleLogo;
    case 'apple':
      return AppleLogo;
  }
}

/* Styled Components */

const ButtonContainer = styled(TouchableOpacity)<{ backgroundColor: string }>(
  ({ backgroundColor }) => ({
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  }),
);

const LogoWrapper = styled.View({
  marginRight: 8,
});

const ButtonText = styled.Text<{ textColor: string }>(({ textColor }) => ({
  ...textStyles.body2,
  color: textColor,
}));
