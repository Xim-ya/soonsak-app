import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Application from 'expo-application';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { mapWithField } from '@/features/utils/mapper/fieldMapper';
import { AUTH_DATABASE } from '@/features/utils/constants/dbConfig';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  APPLE_ERROR_CODES,
  GOOGLE_ERROR_CODES,
  type AuthErrorCode,
} from '../constants/authErrors';
import type {
  AuthResultDto,
  ProfileDto,
  AuthErrorDto,
  SocialProvider,
  OAuthProvider,
} from '../types';

// Expo Go에서 웹 브라우저 세션 정리
WebBrowser.maybeCompleteAuthSession();

/** 개발 모드 여부 */
const isDev = __DEV__;

/** 에러 로깅 (개발 모드에서만) */
function logError(message: string, error: unknown): void {
  if (isDev) {
    console.error(`[AuthApi] ${message}:`, error);
  }
}

/** AuthError 생성 */
function createAuthError(
  code: AuthErrorCode,
  provider?: SocialProvider,
  originalError?: unknown,
): AuthErrorDto {
  logError(`${provider ?? 'auth'} error (${code})`, originalError);

  // provider가 undefined인 경우 속성을 제외
  const error: AuthErrorDto = {
    code,
    message: AUTH_ERROR_MESSAGES[code],
  };

  if (provider) {
    error.provider = provider;
  }

  return error;
}

/** 사용자 취소 여부 확인 */
function isUserCancelled(error: unknown, provider: SocialProvider): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorCode = (error as Error & { code?: string }).code;

  if (__DEV__) {
    console.log('[AuthApi] Error code:', errorCode, 'provider:', provider);
  }

  if (provider === 'apple') {
    return errorCode === APPLE_ERROR_CODES.CANCELED;
  }

  if (provider === 'google') {
    return errorCode === GOOGLE_ERROR_CODES.CANCELED || errorCode === statusCodes.SIGN_IN_CANCELLED;
  }

  return false;
}

/** OAuth 리다이렉트 URL */
const OAUTH_REDIRECT_URL = 'soonsak://auth/callback';

/** AuthErrorDto 타입 가드 */
function isAuthError(error: unknown): error is AuthErrorDto {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/** OAuth 웹 브라우저 결과가 취소인지 확인 */
function isOAuthCancelled(result: WebBrowser.WebBrowserAuthSessionResult): boolean {
  return result.type === 'cancel' || result.type === 'dismiss';
}

/** OAuth 콜백 URL에서 토큰/코드 추출 */
interface OAuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
}

function extractOAuthTokens(callbackUrl: string): OAuthTokens {
  const url = new URL(callbackUrl);
  const hashParams = new URLSearchParams(url.hash.substring(1));

  return {
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
    code: url.searchParams.get('code'),
    error: url.searchParams.get('error') || (url.hash.includes('error=') ? 'OAuth error' : null),
  };
}

/** Supabase 세션 설정 (토큰 또는 코드 기반) */
async function setSupabaseSession(
  tokens: OAuthTokens,
  provider: SocialProvider,
): Promise<AuthResultDto> {
  // 액세스 토큰으로 세션 설정
  if (tokens.accessToken) {
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken ?? '',
    });

    if (error) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider, error);
    }

    return { user: data.user, session: data.session };
  }

  // 인증 코드로 세션 교환
  if (tokens.code) {
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(tokens.code);

    if (error) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider, error);
    }

    return { user: data.user, session: data.session };
  }

  throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider, 'No token or code received');
}

/**
 * OAuth 웹 브라우저 방식 공통 로그인
 * Google, Kakao 등 OAuth 프로바이더에서 공통으로 사용
 */
async function signInWithOAuthBrowser(provider: OAuthProvider): Promise<AuthResultDto> {
  try {
    if (__DEV__) {
      console.log(`[AuthApi] ${provider} OAuth - redirectTo:`, OAUTH_REDIRECT_URL);
    }

    // Supabase OAuth URL 생성
    const { data: oauthData, error: oauthError } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: OAUTH_REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (oauthError || !oauthData.url) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider, oauthError);
    }

    if (__DEV__) {
      console.log(`[AuthApi] ${provider} OAuth URL:`, oauthData.url);
    }

    // 웹 브라우저로 OAuth 페이지 열기
    // preferEphemeralSession: iOS에서 "앱이 supabase.co를 사용하여 로그인" 팝업 제거
    const result = await WebBrowser.openAuthSessionAsync(oauthData.url, OAUTH_REDIRECT_URL, {
      preferEphemeralSession: true,
    });

    if (__DEV__) {
      console.log(`[AuthApi] ${provider} OAuth result:`, result.type);
    }

    // 사용자 취소 처리
    if (isOAuthCancelled(result)) {
      throw createAuthError(AUTH_ERROR_CODES.USER_CANCELLED, provider);
    }

    // 성공 여부 확인
    if (result.type !== 'success' || !result.url) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider);
    }

    // 콜백 URL에서 토큰 추출
    const tokens = extractOAuthTokens(result.url);

    if (__DEV__) {
      console.log(`[AuthApi] ${provider} OAuth callback URL:`, result.url);
    }

    // OAuth 에러 확인
    if (tokens.error) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, provider, tokens.error);
    }

    // Supabase 세션 설정
    return await setSupabaseSession(tokens, provider);
  } catch (error) {
    // 이미 AuthErrorDto인 경우 그대로 전달
    if (isAuthError(error)) {
      throw error;
    }

    throw createAuthError(AUTH_ERROR_CODES.UNKNOWN_ERROR, provider, error);
  }
}

/**
 * Google 네이티브 로그인
 * @react-native-google-signin/google-signin SDK + Supabase signInWithIdToken 방식
 *
 * 규칙 1.3: Google Play 서비스 확인(의존성 없음)을 먼저 수행한 뒤,
 * 결과에 의존하는 signIn → signInWithIdToken 순으로 처리합니다.
 */
async function signInWithGoogleNative(): Promise<AuthResultDto> {
  try {
    // Step 1: Google Play 서비스 가용성 확인 (Android 전용, iOS는 항상 통과)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Step 2: Google 로그인 팝업 호출 → ID 토큰 획득
    const signInResult = await GoogleSignin.signIn();

    if (__DEV__) {
      console.log('[AuthApi] Google signIn result type:', signInResult.type);
    }

    // 규칙 1.2: 조건부 로직은 await 전에 평가
    // 사용자 취소는 Supabase 호출 전에 처리
    if (signInResult.type === 'cancelled') {
      throw createAuthError(AUTH_ERROR_CODES.USER_CANCELLED, 'google');
    }

    const idToken = signInResult.data?.idToken;

    if (!idToken) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, 'google', 'idToken이 없습니다.');
    }

    // Step 3: Supabase에 ID 토큰으로 세션 교환
    // iOS에서는 nonce를 지원하지 않으므로 Supabase 대시보드에서 "Skip nonce check" 활성화 필요
    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, 'google', error);
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    // 이미 AuthErrorDto인 경우 그대로 전달
    if (isAuthError(error)) {
      throw error;
    }

    // Google Play 서비스 미설치/구버전 (Android)
    const errorCode = (error as Error & { code?: string })?.code;
    if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw createAuthError(AUTH_ERROR_CODES.GOOGLE_PLAY_NOT_AVAILABLE, 'google', error);
    }

    // 사용자 취소
    if (isUserCancelled(error, 'google')) {
      throw createAuthError(AUTH_ERROR_CODES.USER_CANCELLED, 'google');
    }

    throw createAuthError(AUTH_ERROR_CODES.UNKNOWN_ERROR, 'google', error);
  }
}

export const authApi = {
  /**
   * Google 소셜 로그인
   * 네이티브 SDK 방식: @react-native-google-signin/google-signin + Supabase signInWithIdToken
   * configure()는 앱 초기화 시 configureGoogleSignin()으로 별도 호출 필요
   */
  signInWithGoogle: async (): Promise<AuthResultDto> => {
    return signInWithGoogleNative();
  },

  /**
   * Apple 소셜 로그인 (iOS 전용)
   * 네이티브 SDK를 통한 ID 토큰 기반 로그인
   */
  signInWithApple: async (): Promise<AuthResultDto> => {
    if (Platform.OS !== 'ios') {
      throw createAuthError(AUTH_ERROR_CODES.UNKNOWN_ERROR, 'apple');
    }

    try {
      // 디버깅: 현재 앱 번들 ID 확인
      if (__DEV__) {
        console.log('[AuthApi] Apple - Bundle ID:', Application.applicationId);
      }

      // Apple 로그인 요청
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const idToken = credential.identityToken;

      if (!idToken) {
        throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, 'apple');
      }

      // 디버깅: ID 토큰의 audience 확인
      if (__DEV__) {
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts[1]) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('[AuthApi] Apple - Token audience (aud):', payload.aud);
          }
        } catch {
          console.log('[AuthApi] Apple - Could not decode token');
        }
      }

      // Supabase에 ID 토큰으로 로그인
      const { data, error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });

      if (error) {
        throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, 'apple', error);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      if (isUserCancelled(error, 'apple')) {
        throw createAuthError(AUTH_ERROR_CODES.USER_CANCELLED, 'apple');
      }

      // 이미 AuthErrorDto인 경우 그대로 전달
      if (isAuthError(error)) {
        throw error;
      }

      throw createAuthError(AUTH_ERROR_CODES.UNKNOWN_ERROR, 'apple', error);
    }
  },

  /**
   * 카카오 소셜 로그인
   * OAuth 웹 브라우저를 통한 로그인
   */
  signInWithKakao: async (): Promise<AuthResultDto> => {
    return signInWithOAuthBrowser('kakao');
  },

  /**
   * 현재 사용자 프로필 조회
   */
  getProfile: async (userId: string): Promise<ProfileDto | null> => {
    const { data, error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logError('프로필 조회 실패', error);
      return null;
    }

    return mapWithField<ProfileDto>(data);
  },

  /**
   * 프로필 업데이트
   */
  updateProfile: async (
    userId: string,
    updates: Partial<Pick<ProfileDto, 'displayName' | 'avatarUrl'>>,
  ): Promise<ProfileDto | null> => {
    const { data, error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .update({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logError('프로필 업데이트 실패', error);
      return null;
    }

    return mapWithField<ProfileDto>(data);
  },

  /**
   * 로그아웃
   */
  signOut: async (): Promise<void> => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      logError('로그아웃 실패', error);
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, undefined, error);
    }
  },

  /**
   * 인증 상태 변경 구독
   */
  onAuthStateChange: (
    callback: (event: string, session: AuthResultDto['session']) => void,
  ): { unsubscribe: () => void } => {
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return { unsubscribe: data.subscription.unsubscribe };
  },

  /**
   * 현재 세션 조회
   */
  getSession: async (): Promise<AuthResultDto['session']> => {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      logError('세션 조회 실패', error);
      return null;
    }

    return data.session;
  },

  /**
   * 회원탈퇴
   *
   * Edge Function을 통해 사용자 데이터 및 계정을 삭제합니다.
   * - 사용자 관련 데이터 삭제 (평점, 즐겨찾기, 시청기록, 프로필)
   * - Supabase Auth에서 사용자 삭제
   */
  withdrawUser: async (): Promise<void> => {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, undefined, '로그인이 필요합니다.');
    }

    const accessToken = sessionData.session.access_token;

    const { data, error } = await supabaseClient.functions.invoke('delete-user', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      logError('회원탈퇴 실패', error);
      throw createAuthError(AUTH_ERROR_CODES.SUPABASE_ERROR, undefined, error);
    }

    if (!data?.success) {
      throw createAuthError(
        AUTH_ERROR_CODES.SUPABASE_ERROR,
        undefined,
        data?.error ?? '회원탈퇴 처리 중 오류가 발생했습니다.',
      );
    }

    // 로컬 세션 클리어 (AsyncStorage의 세션 토큰 삭제)
    await supabaseClient.auth.signOut();
  },
};

interface GoogleSigninConfig {
  /** Google Cloud Console의 OAuth 2.0 웹 클라이언트 ID (필수) */
  webClientId: string;
  /** iOS 클라이언트 ID (iOS에서 필수) */
  iosClientId?: string;
}

/**
 * Google 로그인 초기화
 *
 * 앱 시작 시 단 한 번만 호출해야 합니다. (App.tsx 등 루트 컴포넌트)
 *
 * @example
 * // App.tsx (컴포넌트 바깥, 모듈 최상단)
 * configureGoogleSignin({
 *   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
 *   iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
 * });
 */
export function configureGoogleSignin(config: GoogleSigninConfig): void {
  GoogleSignin.configure({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    offlineAccess: false,
  });
}
