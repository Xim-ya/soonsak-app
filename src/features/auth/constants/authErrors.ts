/** 인증 에러 코드 */
export const AUTH_ERROR_CODES = {
  // 사용자 취소 (무시해도 됨)
  USER_CANCELLED: 'USER_CANCELLED',

  // 네트워크 에러
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Google 관련 에러
  GOOGLE_PLAY_NOT_AVAILABLE: 'GOOGLE_PLAY_NOT_AVAILABLE',

  // Supabase 에러
  SUPABASE_ERROR: 'SUPABASE_ERROR',

  // 알 수 없는 에러
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/** 인증 에러 메시지 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.USER_CANCELLED]: '로그인이 취소되었습니다.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [AUTH_ERROR_CODES.GOOGLE_PLAY_NOT_AVAILABLE]: 'Google Play 서비스를 업데이트해주세요.',
  [AUTH_ERROR_CODES.SUPABASE_ERROR]: '로그인 중 오류가 발생했습니다.',
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
};

/** Apple 에러 코드 맵핑 */
export const APPLE_ERROR_CODES = {
  CANCELED: 'ERR_REQUEST_CANCELED',
} as const;

/** Google 에러 코드 맵핑 (@react-native-google-signin/google-signin) */
export const GOOGLE_ERROR_CODES = {
  /** 사용자가 로그인 팝업을 직접 닫은 경우 */
  CANCELED: 'SIGN_IN_CANCELLED',
  /** 기기에 Google Play 서비스가 없거나 오래된 경우 */
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  /** 네트워크 연결 없음 */
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/** 유효한 AuthErrorCode인지 확인하는 타입 가드 */
export function isValidAuthErrorCode(code: string): code is AuthErrorCode {
  return Object.values(AUTH_ERROR_CODES).includes(code as AuthErrorCode);
}

/** 사용자 취소 에러인지 확인 */
export function isUserCancelledError(code: string): boolean {
  return code === AUTH_ERROR_CODES.USER_CANCELLED;
}
