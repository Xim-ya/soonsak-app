/**
 * Route Registry - 라우트 메타데이터 단일 소스
 *
 * 모든 라우트 관련 설정을 중앙에서 관리합니다.
 * 딥링크 지원 여부, 인증 필요 여부, 딥링크 경로 등을 한 곳에서 정의합니다.
 *
 * 새 화면 추가 시:
 * 1. routePages.ts에 화면 이름 추가
 * 2. types/index.ts에 파라미터 타입 추가
 * 3. 이 파일의 DEEP_LINK_SCREENS 또는 AUTH_REQUIRED_SCREENS에 추가
 * 4. 딥링크 지원 시 deepLinkConfig에 경로 설정 추가
 *
 * 이 파일에서 파생되는 설정들:
 * - linkingConfig.ts: 딥링크 설정
 * - authRequiredScreens.ts: 인증 필요 화면 목록
 * - notificationTypes.ts: DEEP_LINK_SCREENS
 *
 * @see docs/push-notification-deep-link-spec.md
 */
import { routePages } from '../constant/routePages';

import type { RootStackParamList } from '../types';

/**
 * 딥링크 설정 타입
 *
 * parse의 키가 RootStackParamList[T]의 키와 일치하도록 강제합니다.
 * 잘못된 키나 리턴 타입 사용 시 컴파일 에러가 발생합니다.
 */
type DeepLinkScreenConfig<T extends DeepLinkScreen> =
  | string
  | {
      path: string;
      parse?: {
        // RootStackParamList[T]에 있는 키만 허용, 리턴 타입도 일치해야 함
        [K in keyof NonNullable<RootStackParamList[T]>]?: (
          value: string,
        ) => NonNullable<RootStackParamList[T]>[K];
      };
    };

/* ========================================
 * 단일 소스: 딥링크 지원 화면 목록
 * ======================================== */

/**
 * 딥링크 지원 화면 목록 (const array로 타입 추론 유지)
 *
 * 새 딥링크 화면 추가 시 이 배열에 추가하세요.
 */
export const DEEP_LINK_SCREENS = [
  routePages.contentDetail,
  routePages.player,
  routePages.channelDetail,
  routePages.search,
  routePages.settings,
  routePages.userContentList,
  routePages.adminContentRegistration,
  routePages.reviewFunnel,
] as const;

export type DeepLinkScreen = (typeof DEEP_LINK_SCREENS)[number];

/* ========================================
 * 단일 소스: 인증 필요 화면 목록
 * ======================================== */

/**
 * 인증 필요 화면 목록 (const array로 타입 추론 유지)
 *
 * 새 인증 필요 화면 추가 시 이 배열에 추가하세요.
 */
export const AUTH_REQUIRED_SCREENS = [routePages.userContentList, routePages.reviewFunnel] as const;

export type AuthRequiredScreen = (typeof AUTH_REQUIRED_SCREENS)[number];

/* ========================================
 * 딥링크 경로 설정
 * ======================================== */

/**
 * 타입 안전한 딥링크 설정 헬퍼
 *
 * parse의 키가 RootStackParamList에 없으면 컴파일 에러 발생
 */
function defineDeepLink<T extends DeepLinkScreen>(
  _screen: T,
  config: DeepLinkScreenConfig<T>,
): DeepLinkScreenConfig<T> {
  return config;
}

/**
 * 딥링크 경로 설정
 *
 * 각 화면의 딥링크 URL 경로와 파라미터 파서를 정의합니다.
 * parse에 RootStackParamList에 없는 키를 사용하면 컴파일 에러가 발생합니다.
 */
export const deepLinkConfig = {
  /**
   * 콘텐츠 상세
   * @example quickExplore://content/123?type=movie
   */
  [routePages.contentDetail]: defineDeepLink(routePages.contentDetail, {
    path: 'content/:id',
    parse: {
      id: (id: string) => Number(id),
      type: (type: string) => (type || 'unknown') as RootStackParamList['ContentDetail']['type'],
    },
  }),

  /**
   * 플레이어
   * @example quickExplore://player/abc123?contentId=456&contentType=movie&startSeconds=60
   */
  [routePages.player]: defineDeepLink(routePages.player, {
    path: 'player/:videoId',
    parse: {
      contentId: (id: string) => Number(id),
      startSeconds: (seconds: string) => (seconds ? Number(seconds) : undefined),
      contentType: (type: string) =>
        (type || 'unknown') as RootStackParamList['Player']['contentType'],
    },
  }),

  /**
   * 채널 상세
   * @example quickExplore://channel/:channelId
   */
  [routePages.channelDetail]: defineDeepLink(routePages.channelDetail, 'channel/:channelId'),

  /**
   * 검색
   * @example quickExplore://search
   */
  [routePages.search]: defineDeepLink(routePages.search, 'search'),

  /**
   * 설정
   * @example quickExplore://settings
   */
  [routePages.settings]: defineDeepLink(routePages.settings, 'settings'),

  /**
   * 사용자 콘텐츠 목록 (찜/평가/시청기록)
   * @example quickExplore://my-contents?initialTab=1
   */
  [routePages.userContentList]: defineDeepLink(routePages.userContentList, {
    path: 'my-contents',
    parse: {
      initialTab: (tab: string) =>
        tab ? (Number(tab) as RootStackParamList['UserContentList']['initialTab']) : undefined,
    },
  }),

  /**
   * 어드민 콘텐츠 등록
   * @example quickExplore://admin/content-registration
   */
  [routePages.adminContentRegistration]: defineDeepLink(
    routePages.adminContentRegistration,
    'admin/content-registration',
  ),

  /**
   * 리뷰 퍼널 (편지 + 리뷰 유도)
   * @example quickExplore://review-funnel
   */
  [routePages.reviewFunnel]: defineDeepLink(routePages.reviewFunnel, 'review-funnel'),
} satisfies Record<DeepLinkScreen, DeepLinkScreenConfig<DeepLinkScreen>>;

/* ========================================
 * 유틸리티 함수
 * ======================================== */

/**
 * 딥링크 설정 반환 (linkingConfig용)
 */
export function getDeepLinkConfig(): typeof deepLinkConfig {
  return deepLinkConfig;
}

/**
 * 해당 화면이 딥링크를 지원하는지 확인 (타입 가드)
 */
export function isDeepLinkScreen(screen: string): screen is DeepLinkScreen {
  return DEEP_LINK_SCREENS.includes(screen as DeepLinkScreen);
}

/**
 * 해당 화면이 인증을 필요로 하는지 확인 (타입 가드)
 */
export function isAuthRequiredScreen(screen: string): screen is AuthRequiredScreen {
  return AUTH_REQUIRED_SCREENS.includes(screen as AuthRequiredScreen);
}
