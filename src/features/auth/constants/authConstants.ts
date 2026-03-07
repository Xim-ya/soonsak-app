import { Platform } from 'react-native';
import colors from '@/presentation/styles/colors';
import type { SocialProvider } from '../types';

/** 앱 URL 스킴 (OAuth 딥링크용) */
export const APP_SCHEME = 'soonsak';

/** OAuth 리다이렉트 URL */
export const OAUTH_REDIRECT_URL = `${APP_SCHEME}://auth/callback`;

/** 플랫폼별 사용 가능한 소셜 로그인 프로바이더 */
export const AVAILABLE_PROVIDERS: SocialProvider[] =
  Platform.OS === 'ios' ? ['kakao', 'google', 'apple'] : ['kakao', 'google'];

/**
 * 소셜 로그인 브랜드 색상
 * 각 플랫폼 브랜드 가이드라인에 따른 고정 색상
 */
const SOCIAL_BRAND_COLORS = {
  kakao: '#FEE500',
} as const;

/** 소셜 로그인 버튼 설정 */
export interface SocialLoginButtonConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
}

export const SOCIAL_LOGIN_CONFIG: Record<SocialProvider, SocialLoginButtonConfig> = {
  kakao: {
    label: '카카오로 시작하기',
    backgroundColor: SOCIAL_BRAND_COLORS.kakao,
    textColor: colors.black,
  },
  google: {
    label: 'Google로 시작하기',
    backgroundColor: colors.white,
    textColor: colors.black,
  },
  apple: {
    label: 'Apple로 시작하기',
    backgroundColor: colors.white,
    textColor: colors.black,
  },
};
