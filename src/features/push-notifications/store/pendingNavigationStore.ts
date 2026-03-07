/**
 * Pending Navigation Store
 *
 * 비로그인 상태에서 인증 필요 화면으로 딥링크 접근 시,
 * 로그인 후 이동할 목적지를 임시 저장합니다.
 *
 * @see docs/push-notification-deep-link-spec.md (섹션 13)
 */
import type { AuthRequiredScreen } from '@/presentation/navigation/config/routeRegistry';
import type { RootStackParamList } from '@/presentation/navigation/types';

interface PendingNavigation<T extends AuthRequiredScreen = AuthRequiredScreen> {
  screen: T;
  params: RootStackParamList[T];
}

let pendingNavigation: PendingNavigation | null = null;

export const pendingNavigationStore = {
  /**
   * pending navigation 설정
   *
   * 비로그인 상태에서 인증 필요 화면 접근 시 호출
   */
  set: <T extends AuthRequiredScreen>(navigation: PendingNavigation<T>): void => {
    pendingNavigation = navigation;
  },

  /**
   * pending navigation 조회
   *
   * 로그인 성공 후 호출하여 목적지 확인
   */
  get: (): PendingNavigation | null => {
    return pendingNavigation;
  },

  /**
   * pending navigation 초기화
   *
   * 목적지 이동 후 또는 취소 시 호출
   */
  clear: (): void => {
    pendingNavigation = null;
  },

  /**
   * pending navigation 존재 여부 확인
   */
  hasPending: (): boolean => {
    return pendingNavigation !== null;
  },
};
