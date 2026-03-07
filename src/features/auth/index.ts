/**
 * features/auth
 *
 * 인증 관련 기능 통합 export
 */

// Providers
export { AuthProvider, useAuth } from './providers';

// API
export { authApi } from './api/authApi';

// Types
export type {
  SocialProvider,
  OAuthProvider,
  AuthStatus,
  UserRole,
  ProfileDto,
  AuthResultDto,
  AuthErrorDto,
  AuthState,
  UserProfileModel,
  AuthContextValue,
} from './types';

// Guards
export { AdminOnly } from './guards';

// Constants
export {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  APPLE_ERROR_CODES,
  GOOGLE_ERROR_CODES,
  KAKAO_ERROR_CODES,
  isValidAuthErrorCode,
  isUserCancelledError,
} from './constants/authErrors';
export type { AuthErrorCode } from './constants/authErrors';
