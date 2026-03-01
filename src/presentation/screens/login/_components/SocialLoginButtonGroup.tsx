import styled from '@emotion/native';
import { SocialLoginButton } from './SocialLoginButton';
import { AVAILABLE_PROVIDERS } from '@/features/auth/constants/authConstants';
import type { SocialProvider } from '@/features/auth/types';

const BUTTON_GAP = 10;

interface SocialLoginButtonGroupProps {
  onLogin: (provider: SocialProvider) => void;
  loadingProvider: SocialProvider | null;
}

/**
 * SocialLoginButtonGroup - 소셜 로그인 버튼 그룹 컴포넌트
 *
 * 플랫폼별로 사용 가능한 소셜 로그인 버튼들을 표시합니다.
 * - iOS: 카카오, Google, Apple
 * - Android: 카카오, Google
 *
 * @example
 * <SocialLoginButtonGroup
 *   onLogin={handleLogin}
 *   loadingProvider={loadingProvider}
 * />
 */
export function SocialLoginButtonGroup({ onLogin, loadingProvider }: SocialLoginButtonGroupProps) {
  return (
    <Container>
      {AVAILABLE_PROVIDERS.map((provider) => (
        <SocialLoginButton
          key={provider}
          provider={provider}
          onPress={() => onLogin(provider)}
          isLoading={loadingProvider === provider}
          disabled={loadingProvider !== null}
        />
      ))}
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  gap: BUTTON_GAP,
});
