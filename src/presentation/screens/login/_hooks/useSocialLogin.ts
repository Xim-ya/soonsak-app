import { useState, useCallback } from 'react';
import { useDialog } from '@/presentation/components/dialog';
import { authApi } from '@/features/auth/api/authApi';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_ERROR_CODES,
  isUserCancelledError,
  isValidAuthErrorCode,
} from '@/features/auth/constants/authErrors';
import type { SocialProvider, AuthErrorDto } from '@/features/auth/types';

/** AuthErrorDto 타입 가드 */
function isAuthError(error: unknown): error is AuthErrorDto {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/** 인증 에러 처리 */
async function handleAuthError(
  error: unknown,
  showDialog: (options: {
    title: string;
    description: string;
    buttonText: string;
  }) => Promise<'confirm' | 'backdrop'>,
): Promise<void> {
  // AuthErrorDto가 아닌 경우 기본 에러 메시지 표시
  if (!isAuthError(error)) {
    await showDialog({
      title: '로그인 오류',
      description: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR],
      buttonText: '확인',
    });
    return;
  }

  // 사용자 취소는 무시
  if (isUserCancelledError(error.code)) {
    return;
  }

  // 에러 메시지 표시
  const message = isValidAuthErrorCode(error.code)
    ? AUTH_ERROR_MESSAGES[error.code]
    : AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR];

  await showDialog({
    title: '로그인 오류',
    description: message,
    buttonText: '확인',
  });
}

/**
 * useSocialLogin - 소셜 로그인 비즈니스 로직 훅
 *
 * 소셜 로그인 처리 및 에러 핸들링을 담당합니다.
 * 로그인 성공 시 AuthProvider에서 상태가 자동으로 업데이트됩니다.
 *
 * @example
 * const { handleLogin, loadingProvider } = useSocialLogin();
 *
 * <SocialLoginButtonGroup
 *   onLogin={handleLogin}
 *   loadingProvider={loadingProvider}
 * />
 */
export function useSocialLogin() {
  const { showDialog } = useDialog();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const handleLogin = useCallback(
    async (provider: SocialProvider, onSuccess?: () => void) => {
      setLoadingProvider(provider);

      try {
        switch (provider) {
          case 'google':
            await authApi.signInWithGoogle();
            break;
          case 'apple':
            await authApi.signInWithApple();
            break;
          case 'kakao':
            await authApi.signInWithKakao();
            break;
        }
        // 로그인 성공 시 AuthProvider에서 상태 자동 업데이트
        // 네비게이션 변경도 자동 처리됨
        onSuccess?.();
      } catch (error) {
        if (__DEV__) {
          console.error('[useSocialLogin] Login error:', error);
        }
        await handleAuthError(error, showDialog);
      } finally {
        setLoadingProvider(null);
      }
    },
    [showDialog],
  );

  return {
    handleLogin,
    loadingProvider,
  };
}
