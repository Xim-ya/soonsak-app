/**
 * 인증이 필요한 화면 목록
 *
 * 이 목록에 포함된 화면은 비로그인 상태에서 접근 시
 * 로그인 화면으로 리다이렉트됩니다.
 *
 * 딥링크, 푸시 알림 등 앱 외부에서 진입할 때도 적용됩니다.
 *
 * 인증 필요 화면은 routeRegistry에서 관리됩니다.
 * 새 인증 필요 화면 추가 시 routeRegistry.ts만 수정하세요.
 *
 * @see src/shared/navigation/config/routeRegistry.ts
 * @see docs/push-notification-deep-link-spec.md (섹션 13)
 */
import {
  AUTH_REQUIRED_SCREENS,
  isAuthRequiredScreen,
  type AuthRequiredScreen as AuthRequiredScreenType,
} from '@/shared/navigation/config/routeRegistry';

/** routeRegistry에서 인증 필요 화면 목록 re-export */
export const authRequiredScreens = AUTH_REQUIRED_SCREENS;

export type AuthRequiredScreen = AuthRequiredScreenType;

/**
 * 해당 화면이 인증을 필요로 하는지 확인 (타입 가드)
 *
 * @param screen 화면 이름
 * @returns 인증 필요 여부 (true면 screen은 AuthRequiredScreen 타입으로 좁혀짐)
 *
 * @example
 * if (isAuthRequired(screenName)) {
 *   // 여기서 screenName은 AuthRequiredScreen 타입
 *   pendingNavigationStore.set({ screen: screenName, params });
 * }
 */
export function isAuthRequired(screen: string): screen is AuthRequiredScreen {
  return isAuthRequiredScreen(screen);
}
