/**
 * AuthGuard - 인증 필요 화면 접근 제어
 *
 * go_router의 redirect 패턴과 유사하게 동작합니다.
 * 모든 네비게이션을 감시하여 인증 필요 화면에 비로그인 상태로 접근 시
 * 자동으로 로그인 화면으로 리다이렉트합니다.
 *
 * 이 컴포넌트는 StackNavigator 내부에 배치되어야 합니다.
 *
 * @example
 * // StackNavigator.tsx
 * <Stack.Navigator>
 *   <Stack.Screen name="MainTabs">
 *     {() => (
 *       <>
 *         <AuthGuard />
 *         <TabNavigator />
 *       </>
 *     )}
 *   </Stack.Screen>
 * </Stack.Navigator>
 */
import { useEffect, useRef } from 'react';
import { useNavigation, useNavigationState, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { routePages } from '../constant/routePages';
import { isAuthRequired } from '../constant/authRequiredScreens';
import { pendingNavigationStore } from '@/features/push-notifications/store/pendingNavigationStore';
import { useAuth } from '@/shared/providers/AuthProvider';
import { AuthLogger } from '@/shared/utils/logger';

/**
 * AuthGuard 컴포넌트
 *
 * 현재 라우트가 인증 필요 화면이고 비로그인 상태면 로그인으로 리다이렉트합니다.
 * pending navigation에 현재 화면 정보를 저장하여 로그인 후 복귀할 수 있도록 합니다.
 */
export function AuthGuard(): null {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';
  const isInitializing = status === 'idle';

  // 현재 navigation state 전체 가져오기
  const navigationState = useNavigationState((state) => state);

  // 이전에 처리한 라우트 추적 (중복 리다이렉트 방지)
  const lastHandledRouteRef = useRef<string | null>(null);

  // 이전 status 추적 (세션 복원 완료 직후 불필요한 리다이렉트 방지)
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // 초기화 중이면 스킵 (세션 복원 대기)
    if (isInitializing) return;

    // 세션 복원 완료 직후 (idle → authenticated)면 스킵
    // 이미 로그인된 사용자가 불필요하게 리다이렉트되는 것 방지
    if (prevStatus === 'idle' && status === 'authenticated') return;

    // navigation state가 없으면 스킵
    if (!navigationState?.routes?.length) return;

    // 현재 최상위 라우트 정보
    const currentRoute = navigationState.routes[navigationState.routes.length - 1];
    if (!currentRoute) return;

    const currentScreen = currentRoute.name;
    const currentParams = currentRoute.params;

    // 로그인 화면이면 스킵 (무한 루프 방지)
    if (currentScreen === routePages.login) return;

    // 이미 처리한 라우트면 스킵
    const routeKey = `${currentScreen}-${JSON.stringify(currentParams)}`;
    if (lastHandledRouteRef.current === routeKey) return;

    // 인증 필요 화면 + 비로그인 상태 체크
    if (isAuthRequired(currentScreen) && !isLoggedIn) {
      // 중복 처리 방지
      lastHandledRouteRef.current = routeKey;

      // pending navigation 저장 (로그인 후 복귀용)
      // isAuthRequired 타입 가드로 currentScreen은 AuthRequiredScreen 타입
      pendingNavigationStore.set({
        screen: currentScreen,
        params: currentParams as RootStackParamList[typeof currentScreen],
      });

      // 로그인 화면으로 리다이렉트
      // replace를 사용하여 현재 화면을 로그인 화면으로 교체
      // 이렇게 하면 뒤로가기 시 인증 필요 화면으로 돌아가지 않음
      navigation.reset({
        index: 1,
        routes: [
          { name: routePages.mainTabs },
          { name: routePages.login, params: { canGoBack: false, referrerScreen: currentScreen } },
        ],
      });

      AuthLogger.log(`인증 필요 화면 접근 감지: ${currentScreen} → 로그인으로 리다이렉트`);
    }
  }, [navigationState, isLoggedIn, isInitializing, navigation, status]);

  return null;
}
