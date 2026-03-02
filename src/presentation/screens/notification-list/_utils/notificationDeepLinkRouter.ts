/**
 * Notification DeepLink Router
 *
 * 알림 클릭 시 딥링크 파싱 및 네비게이션을 처리합니다.
 *
 * @description
 * - Readability 원칙: 긴 switch문을 라우터 맵으로 분리
 * - Predictability 원칙: 일관된 네비게이션 패턴 적용
 * - Cohesion 원칙: 딥링크 관련 로직을 한 곳에 응집
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentType } from '@/shared/types/content/contentType.enum';
import type { NotificationItem } from '@/features/notifications';

// ============================================================================
// Types
// ============================================================================

/** 딥링크 파싱 결과 */
interface DeepLinkInfo {
  screen: string | null;
  params: Record<string, unknown> | null;
}

/** 지원하는 딥링크 화면 타입 */
type DeepLinkScreen =
  | 'ContentDetail'
  | 'Player'
  | 'ChannelDetail'
  | 'Search'
  | 'Settings'
  | 'UserContentList';

/** 네비게이션 타입 */
type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** 라우트 핸들러 타입 */
type RouteHandler = (navigation: Navigation, params: Record<string, unknown> | null) => void;

// ============================================================================
// Route Handlers (화면별 네비게이션 핸들러)
// ============================================================================

/**
 * 콘텐츠 상세 화면 네비게이션
 */
const navigateToContentDetail: RouteHandler = (navigation, params) => {
  const hasRequiredParams = params?.['id'] && params?.['type'];
  if (!hasRequiredParams) return;

  navigation.navigate(routePages.contentDetail, {
    id: params['id'] as number,
    type: params['type'] as ContentType,
    title: (params['title'] as string) ?? undefined,
  });
};

/**
 * 플레이어 화면 네비게이션
 */
const navigateToPlayer: RouteHandler = (navigation, params) => {
  const hasRequiredParams = params?.['videoId'] && params?.['contentId'] && params?.['contentType'];
  if (!hasRequiredParams) return;

  navigation.navigate(routePages.player, {
    videoId: params['videoId'] as string,
    title: params['title'] as string,
    contentId: params['contentId'] as number,
    contentType: params['contentType'] as ContentType,
    startSeconds: params['startSeconds'] as number | undefined,
  });
};

/**
 * 채널 상세 화면 네비게이션
 */
const navigateToChannelDetail: RouteHandler = (navigation, params) => {
  if (!params?.['channelId']) return;

  const channelName = params['channelName'] as string | undefined;
  navigation.navigate(routePages.channelDetail, {
    channelId: params['channelId'] as string,
    ...(channelName ? { channelName } : {}),
  });
};

/**
 * 검색 화면 네비게이션
 */
const navigateToSearch: RouteHandler = (navigation) => {
  navigation.navigate(routePages.search);
};

/**
 * 설정 화면 네비게이션
 */
const navigateToSettings: RouteHandler = (navigation) => {
  navigation.navigate(routePages.settings);
};

/**
 * 사용자 콘텐츠 목록 화면 네비게이션
 */
const navigateToUserContentList: RouteHandler = (navigation, params) => {
  const initialTab = params?.['initialTab'] as 0 | 1 | 2 | undefined;
  navigation.navigate(routePages.userContentList, {
    ...(initialTab !== undefined ? { initialTab } : {}),
  });
};

// ============================================================================
// Route Map (화면별 핸들러 매핑)
// ============================================================================

/**
 * 딥링크 화면과 핸들러를 매핑하는 라우터 맵
 *
 * @description
 * - 새로운 화면 추가 시 여기에만 핸들러를 등록하면 됨
 * - Readability: switch문 대신 선언적 매핑 사용
 */
const DEEP_LINK_ROUTE_MAP: Record<DeepLinkScreen, RouteHandler> = {
  ContentDetail: navigateToContentDetail,
  Player: navigateToPlayer,
  ChannelDetail: navigateToChannelDetail,
  Search: navigateToSearch,
  Settings: navigateToSettings,
  UserContentList: navigateToUserContentList,
};

// ============================================================================
// Public Functions
// ============================================================================

/**
 * 알림 데이터에서 딥링크 정보를 추출합니다.
 *
 * @param item 알림 아이템
 * @returns 화면 이름과 파라미터
 */
export function parseNotificationDeepLink(item: NotificationItem): DeepLinkInfo {
  const data = item.data;
  const noDeepLink: DeepLinkInfo = { screen: null, params: null };

  if (!data) return noDeepLink;

  // action 필드 확인 (푸시 알림 페이로드 구조)
  const action = data['action'] as Record<string, unknown> | undefined;
  if (!action) return noDeepLink;

  // NAVIGATION 타입인 경우만 처리
  const isNavigationType = action['type'] === 'NAVIGATION';
  if (!isNavigationType) return noDeepLink;

  return {
    screen: action['screen'] as string | null,
    params: (action['params'] as Record<string, unknown>) ?? null,
  };
}

/**
 * 딥링크 화면이 지원되는지 확인합니다.
 */
function isSupportedScreen(screen: string): screen is DeepLinkScreen {
  return screen in DEEP_LINK_ROUTE_MAP;
}

/**
 * 딥링크 정보를 기반으로 네비게이션을 수행합니다.
 *
 * @param navigation 네비게이션 객체
 * @param deepLinkInfo 파싱된 딥링크 정보
 * @returns 네비게이션이 수행되었는지 여부
 */
export function navigateByDeepLink(navigation: Navigation, deepLinkInfo: DeepLinkInfo): boolean {
  const { screen, params } = deepLinkInfo;

  if (!screen) return false;

  // 지원하는 화면인지 확인 후 라우터 맵에서 핸들러 실행
  if (isSupportedScreen(screen)) {
    const handler = DEEP_LINK_ROUTE_MAP[screen];
    handler(navigation, params);
    return true;
  }

  return false;
}

/**
 * 알림 아이템에서 딥링크를 파싱하고 네비게이션을 수행합니다.
 * (편의 함수 - parseNotificationDeepLink + navigateByDeepLink 결합)
 *
 * @param navigation 네비게이션 객체
 * @param item 알림 아이템
 * @returns 네비게이션이 수행되었는지 여부
 */
export function handleNotificationDeepLink(navigation: Navigation, item: NotificationItem): boolean {
  const deepLinkInfo = parseNotificationDeepLink(item);
  return navigateByDeepLink(navigation, deepLinkInfo);
}
