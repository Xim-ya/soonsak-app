import type { User, Session } from '@supabase/supabase-js';
import type { AuthErrorCode } from '../constants/authErrors';

/** 소셜 로그인 프로바이더 타입 */
export type SocialProvider = 'google' | 'apple' | 'kakao';

/** OAuth 지원 프로바이더 (Apple 제외) */
export type OAuthProvider = Exclude<SocialProvider, 'apple'>;

/** 인증 상태 */
export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

/** 유저 역할 */
export type UserRole = 'user' | 'admin' | 'banned';

/** 프로필 DTO */
export interface ProfileDto {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/** 인증 결과 DTO */
export interface AuthResultDto {
  user: User | null;
  session: Session | null;
}

/** 인증 에러 DTO */
export interface AuthErrorDto {
  code: AuthErrorCode;
  message: string;
  provider?: SocialProvider;
}

/** AuthContext 상태 타입 */
export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  /** DB에서 가져온 프로필 데이터 */
  profile: ProfileDto | null;
  /** 프로필 설정 플로우 필요 여부 (신규 사용자) */
  needsProfileSetup: boolean;
}

/** 유저 프로필 Model (profiles 테이블에서 파생, 없으면 OAuth 데이터 사용) */
export interface UserProfileModel {
  displayName: string;
  avatarUrl: string | undefined;
}

/**
 * AuthContext 값 타입
 *
 * presentation 레이어에서 사용하는 타입입니다.
 * ProfileDto를 직접 노출하지 않고, 필요한 데이터만 Model로 제공합니다.
 */
export interface AuthContextValue extends UserProfileModel {
  /** 인증 상태 */
  status: AuthStatus;
  /** Supabase User 객체 (user.id로 사용자 식별) */
  user: User | null;
  /** Supabase Session 객체 */
  session: Session | null;
  /** 유저 역할 */
  role: UserRole;
  /** 관리자 여부 (role === 'admin') */
  isAdmin: boolean;
  /** 프로필 설정 플로우 필요 여부 (신규 사용자) */
  needsProfileSetup: boolean;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 프로필 설정 완료 처리 */
  completeProfileSetup: () => void;
  /** 프로필 새로고침 (프로필 수정 후 호출) */
  refreshProfile: () => Promise<void>;
}
