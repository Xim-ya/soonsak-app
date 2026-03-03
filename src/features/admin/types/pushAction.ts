/**
 * Push Action Types
 *
 * 푸시 알림 딥링크 액션 타입 정의
 * docs/push-notification-test.md 스펙 기반
 */

// ============================================================================
// Screen Types (NAVIGATION)
// ============================================================================

/** 지원하는 네비게이션 화면 */
export type PushNavigationScreen =
  | 'ContentDetail'
  | 'Player'
  | 'ChannelDetail'
  | 'Search'
  | 'Settings'
  | 'UserContentList'
  | 'ReviewFunnel';

/** 콘텐츠 상세 파라미터 */
export interface ContentDetailParams {
  id: number;
  title: string;
  type: 'movie' | 'tv';
}

/** 플레이어 파라미터 */
export interface PlayerParams {
  videoId: string;
  title: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  startSeconds?: number;
}

/** 채널 상세 파라미터 */
export interface ChannelDetailParams {
  channelId: string;
  channelName: string;
}

/** 검색 파라미터 (빈 객체) */
export type SearchParams = Record<string, never>;

/** 설정 파라미터 (빈 객체) */
export type SettingsParams = Record<string, never>;

/** 유저 콘텐츠 목록 파라미터 */
export interface UserContentListParams {
  initialTab: 0 | 1 | 2; // 0: 찜, 1: 평가, 2: 시청기록
}

/** 리뷰 퍼널 파라미터 (빈 객체) */
export type ReviewFunnelParams = Record<string, never>;

/** 화면별 파라미터 매핑 */
export interface ScreenParamsMap {
  ContentDetail: ContentDetailParams;
  Player: PlayerParams;
  ChannelDetail: ChannelDetailParams;
  Search: SearchParams;
  Settings: SettingsParams;
  UserContentList: UserContentListParams;
  ReviewFunnel: ReviewFunnelParams;
}

// ============================================================================
// Action Types (ACTION)
// ============================================================================

/** 지원하는 액션 타입 */
export type PushActionType = 'REQUEST_REVIEW' | 'OPEN_URL' | 'OPEN_SETTINGS' | 'REFRESH_DATA';

/** OPEN_URL 페이로드 */
export interface OpenUrlPayload {
  url: string;
}

/** REFRESH_DATA 페이로드 */
export interface RefreshDataPayload {
  target: string;
}

/** 액션별 페이로드 매핑 */
export interface ActionPayloadMap {
  REQUEST_REVIEW: undefined;
  OPEN_URL: OpenUrlPayload;
  OPEN_SETTINGS: undefined;
  REFRESH_DATA: RefreshDataPayload;
}

// ============================================================================
// Push Data Structure
// ============================================================================

/** 네비게이션 액션 */
export interface NavigationAction<T extends PushNavigationScreen = PushNavigationScreen> {
  type: 'NAVIGATION';
  screen: T;
  params: ScreenParamsMap[T];
}

/** 일반 액션 */
export interface ActionAction<T extends PushActionType = PushActionType> {
  type: 'ACTION';
  action: T;
  payload?: ActionPayloadMap[T];
}

/** 푸시 데이터 액션 (유니온 타입) */
export type PushAction = NavigationAction | ActionAction;

/** 푸시 데이터 전체 구조 */
export interface PushData {
  version: '1.0';
  action: PushAction;
}

// ============================================================================
// UI Helper Types
// ============================================================================

/** 액션 타입 옵션 (UI 드롭다운용) */
export interface ActionTypeOption {
  key: string;
  label: string;
  type: 'none' | 'navigation' | 'action';
  screen?: PushNavigationScreen;
  action?: PushActionType;
}

/** 액션 타입 옵션 목록 */
export const ACTION_TYPE_OPTIONS: readonly ActionTypeOption[] = [
  { key: 'none', label: '없음 (단순 알림)', type: 'none' },
  // NAVIGATION
  { key: 'nav_content', label: '콘텐츠 상세', type: 'navigation', screen: 'ContentDetail' },
  { key: 'nav_player', label: '플레이어 (영상 재생)', type: 'navigation', screen: 'Player' },
  { key: 'nav_channel', label: '채널 상세', type: 'navigation', screen: 'ChannelDetail' },
  { key: 'nav_search', label: '검색 화면', type: 'navigation', screen: 'Search' },
  { key: 'nav_settings', label: '설정 화면', type: 'navigation', screen: 'Settings' },
  { key: 'nav_userlist', label: '내 콘텐츠 목록', type: 'navigation', screen: 'UserContentList' },
  {
    key: 'nav_review_funnel',
    label: '앱 리뷰 적극 유도',
    type: 'navigation',
    screen: 'ReviewFunnel',
  },
  // ACTION
  { key: 'action_review', label: '앱 리뷰 요청', type: 'action', action: 'REQUEST_REVIEW' },
  { key: 'action_url', label: '외부 URL 열기', type: 'action', action: 'OPEN_URL' },
  { key: 'action_settings', label: '시스템 설정 열기', type: 'action', action: 'OPEN_SETTINGS' },
  { key: 'action_refresh', label: '데이터 새로고침', type: 'action', action: 'REFRESH_DATA' },
] as const;

/** UserContentList 탭 옵션 */
export const USER_CONTENT_TAB_OPTIONS = [
  { value: 0, label: '찜 목록' },
  { value: 1, label: '평가 목록' },
  { value: 2, label: '시청 기록' },
] as const;

/** 콘텐츠 타입 옵션 */
export const CONTENT_TYPE_OPTIONS = [
  { value: 'movie', label: '영화' },
  { value: 'tv', label: 'TV 시리즈' },
] as const;
