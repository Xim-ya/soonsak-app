/**
 * Deep Link Linking Configuration
 *
 * React Navigation의 Linking 설정을 정의합니다.
 * 외부 딥링크(URL scheme)를 통한 앱 내 네비게이션을 지원합니다.
 *
 * 딥링크 설정은 routeRegistry에서 관리됩니다.
 * 새 딥링크 화면 추가 시 routeRegistry.ts만 수정하세요.
 *
 * 푸시 알림은 PushNotificationProvider에서 별도로 처리합니다.
 * (인증 필요 화면 체크를 위해 미들웨어 방식 사용)
 *
 * @see src/shared/navigation/config/routeRegistry.ts
 * @see docs/push-notification-deep-link-spec.md (섹션 6)
 */
import type { LinkingOptions, PathConfigMap } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from '@/shared/navigation/types';
import { getDeepLinkConfig } from '@/shared/navigation/config/routeRegistry';

/** URL 스킴 */
const SCHEME = 'soonsak';

/**
 * Linking 설정
 *
 * NavigationContainer에 전달하여 딥링크를 활성화합니다.
 * 딥링크 화면 설정은 routeRegistry에서 자동으로 가져옵니다.
 *
 * @example
 * <NavigationContainer linking={linkingConfig}>
 *   <RootNavigator />
 * </NavigationContainer>
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), `${SCHEME}://`],

  config: {
    // routeRegistry에서 딥링크 설정 자동 생성
    screens: getDeepLinkConfig() as PathConfigMap<RootStackParamList>,
  },

  /**
   * 앱이 종료된 상태(Killed)에서 외부 딥링크로 시작될 때 URL 반환
   *
   * 푸시 알림으로 시작되는 경우는 PushNotificationProvider에서 처리
   */
  async getInitialURL(): Promise<string | null> {
    const url = await Linking.getInitialURL();
    return url;
  },

  /**
   * 앱이 실행 중일 때 외부 딥링크 수신 시 구독
   *
   * 푸시 알림 탭은 PushNotificationProvider에서 처리
   */
  subscribe(listener: (url: string) => void) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  },
};
