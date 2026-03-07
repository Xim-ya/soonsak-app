import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authApi } from '../api/authApi';
import { userApi } from '@/features/user/api/userApi';
import { clearAppBadge } from '@/features/notifications';
import { wowPointWebhook } from '@/core/services/wowPointWebhook';
import type { AuthState, AuthContextValue, UserProfileModel, ProfileDto, UserRole } from '../types';

/** 초기 인증 상태 */
const initialState: AuthState = {
  status: 'idle',
  user: null,
  session: null,
  profile: null,
  needsProfileSetup: false,
};

const DEFAULT_DISPLAY_NAME = '';
const DEFAULT_ROLE: UserRole = 'user';

/**
 * 유저 프로필 Model 파생
 * - profiles 테이블 데이터 우선, 없으면 OAuth 메타데이터 사용
 */
function deriveUserProfile(profile: ProfileDto | null, user: User | null): UserProfileModel {
  // 1순위: profiles 테이블의 데이터
  if (profile?.displayName) {
    return {
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
  }

  // 2순위: OAuth 메타데이터
  if (user) {
    const metadata = user.user_metadata;
    const name = metadata?.['name'];
    const displayName =
      typeof name === 'string' && name.length > 0
        ? name
        : (user.email?.split('@')[0] ?? DEFAULT_DISPLAY_NAME);

    const avatarUrl =
      typeof metadata?.['avatar_url'] === 'string' ? metadata['avatar_url'] : undefined;

    return { displayName, avatarUrl };
  }

  // 기본값
  return { displayName: DEFAULT_DISPLAY_NAME, avatarUrl: undefined };
}

/** AuthContext 생성 */
const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - 전역 인증 상태 관리
 *
 * Supabase Auth의 세션 상태를 실시간으로 감지하고 관리합니다.
 * - 앱 시작 시 저장된 세션 복원
 * - 로그인/로그아웃 이벤트 자동 감지
 * - useAuth() 훅을 통한 인증 상태 접근
 *
 * @example
 * // App.tsx에서 사용
 * <AuthProvider>
 *   <AppContent />
 * </AuthProvider>
 *
 * // 하위 컴포넌트에서 사용
 * const { status, user, signOut } = useAuth();
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // 로그아웃 핸들러
  const signOut = useCallback(async () => {
    await authApi.signOut();
    // 앱 아이콘 배지 초기화
    await clearAppBadge();
    // 상태는 onAuthStateChange에서 자동 업데이트됨
  }, []);

  // 프로필 설정 완료 처리
  const completeProfileSetup = useCallback(() => {
    setState((prev) => ({ ...prev, needsProfileSetup: false }));
  }, []);

  // 프로필 조회
  const fetchProfile = useCallback(async (userId: string): Promise<ProfileDto | null> => {
    try {
      return await userApi.getProfile(userId);
    } catch {
      return null;
    }
  }, []);

  // 프로필 새로고침 (프로필 수정 후 호출)
  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;

    const profile = await fetchProfile(userId);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user?.id, fetchProfile]);

  /**
   * 프로필 설정 필요 여부 확인
   *
   * created_at과 updated_at이 같으면 사용자가 프로필을 수정한 적 없음 (신규 사용자)
   */
  const checkNeedsProfileSetup = useCallback((profile: ProfileDto | null): boolean => {
    if (!profile) return false;

    // 타임스탬프 비교 (5초 이내면 동일하다고 판단)
    const createdAt = new Date(profile.createdAt).getTime();
    const updatedAt = new Date(profile.updatedAt).getTime();
    const timeDiff = Math.abs(updatedAt - createdAt);

    return timeDiff < 5000;
  }, []);

  // 초기 세션 복원 및 상태 변경 구독
  useEffect(() => {
    let mounted = true;

    // 초기 세션 복원
    const restoreSession = async () => {
      const session = await authApi.getSession();

      if (mounted) {
        if (session) {
          // 프로필 조회 (트리거에 의해 자동 생성됨)
          const profile = await fetchProfile(session.user.id);

          // created_at == updated_at이면 프로필 설정 안 한 신규 사용자
          const needsProfileSetup = checkNeedsProfileSetup(profile);

          if (mounted) {
            setState({
              status: 'authenticated',
              user: session.user,
              session,
              profile,
              needsProfileSetup,
            });
          }
        } else {
          setState({
            status: 'unauthenticated',
            user: null,
            session: null,
            profile: null,
            needsProfileSetup: false,
          });
        }
      }
    };

    restoreSession();

    // 인증 상태 변경 구독
    const { unsubscribe } = authApi.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        // 프로필 조회 (트리거에 의해 자동 생성됨)
        const profile = await fetchProfile(session.user.id);

        // created_at == updated_at이면 프로필 설정 안 한 신규 사용자
        const needsProfileSetup = checkNeedsProfileSetup(profile);

        // 기존 유저 로그인 시 웹훅 호출 (신규 가입자는 프로필 설정 완료 시 호출)
        if (!needsProfileSetup && profile?.displayName) {
          wowPointWebhook.onLogin({ nickname: profile.displayName });
        }

        if (mounted) {
          setState({
            status: 'authenticated',
            user: session.user,
            session,
            profile,
            needsProfileSetup,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setState({
          status: 'unauthenticated',
          user: null,
          session: null,
          profile: null,
          needsProfileSetup: false,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState((prev) => ({
          ...prev,
          session,
        }));
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile, checkNeedsProfileSetup]);

  // profiles 테이블 데이터 우선, 없으면 OAuth 데이터 사용
  const userProfile = deriveUserProfile(state.profile, state.user);

  // AuthContextValue: DTO(profile)를 노출하지 않고 필요한 필드만 제공
  const role = state.profile?.role ?? DEFAULT_ROLE;
  const value: AuthContextValue = {
    status: state.status,
    user: state.user,
    session: state.session,
    role,
    isAdmin: role === 'admin',
    needsProfileSetup: state.needsProfileSetup,
    ...userProfile,
    signOut,
    completeProfileSetup,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - 인증 상태 접근 훅
 *
 * AuthProvider 내에서만 사용 가능합니다.
 *
 * @returns AuthContextValue
 * - status: 'idle' | 'authenticated' | 'unauthenticated'
 * - user: Supabase User 객체
 * - session: Supabase Session 객체
 * - displayName: 표시용 사용자 이름 (name > email prefix > '사용자')
 * - avatarUrl: 프로필 이미지 URL
 * - signOut: 로그아웃 함수
 *
 * @example
 * const { status, displayName, avatarUrl, signOut } = useAuth();
 *
 * if (status === 'authenticated') {
 *   console.log('로그인됨:', displayName);
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
