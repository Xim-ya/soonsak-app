/**
 * GA4 Analytics 이벤트 타입 정의
 *
 * 모든 커스텀 이벤트의 타입을 중앙에서 관리합니다.
 * 타입 안전성을 보장하고 하드코딩을 방지합니다.
 */

import type { ContentSourceType } from '../constants/contentSource';
import type { LoginReferrerType } from '../constants/loginReferrer';
import type { ContentType } from '@/shared/types/content/contentType.enum';

// ============================================
// 인증 이벤트 파라미터
// ============================================

export type LoginMethod = 'kakao' | 'google' | 'apple';

export interface LoginStartParams {
  referrer_screen: LoginReferrerType | string;
  can_go_back: boolean;
}

export interface LoginAttemptParams {
  method: LoginMethod;
  referrer_screen: LoginReferrerType | string;
}

export interface LoginSuccessParams {
  method: LoginMethod;
  is_new_user: boolean;
  referrer_screen: LoginReferrerType | string;
}

export interface LoginFailureParams {
  method: LoginMethod;
  error_code: string;
  referrer_screen: LoginReferrerType | string;
}

export interface LoginCancelParams {
  method: LoginMethod;
  referrer_screen: LoginReferrerType | string;
}

export interface LoginSkipParams {
  referrer_screen: LoginReferrerType | string;
}

// ============================================
// 프로필 이벤트 파라미터
// ============================================

export type ProfileSetupMode = 'initial' | 'edit';
export type ProfileImageChangeResult = 'success' | 'cancelled' | 'permission_denied';

export interface ProfileSetupStartParams {
  mode: ProfileSetupMode;
}

export interface ProfileSetupCompleteParams {
  mode: ProfileSetupMode;
  has_profile_image: boolean;
}

export interface ProfileImageChangeParams {
  result: ProfileImageChangeResult;
}

// ============================================
// 콘텐츠 이벤트 파라미터
// ============================================

/** 콘텐츠 타입 (ContentType 재export) */
export type ContentTypeValue = ContentType;
export type FavoriteAction = 'add' | 'remove';
export type RatingAction = 'add' | 'update';

export interface ContentViewParams {
  content_id: number;
  content_type: ContentTypeValue;
  content_title: string;
  source: ContentSourceType;
}

export interface ContentPlayStartParams {
  content_id: number;
  content_type: ContentTypeValue;
  video_id: string;
  is_resume: boolean;
  start_seconds: number;
}

export interface ContentPlayEndParams {
  content_id: number;
  content_type: ContentTypeValue;
  video_id: string;
  watch_duration: number;
  total_duration: number;
  completion_rate: number;
}

export interface ContentFavoriteToggleParams {
  content_id: number;
  content_type: ContentTypeValue;
  action: FavoriteAction;
  screen_name: string;
}

export interface ContentRatingSubmitParams {
  content_id: number;
  content_type: ContentTypeValue;
  rating: number;
  action: RatingAction;
}

export interface ContentShareParams {
  content_id: number;
  content_type: ContentTypeValue;
  share_method: string;
}

// ============================================
// 채널 이벤트 파라미터
// ============================================

export interface ChannelViewParams {
  channel_id: string;
  channel_name: string;
  source: string;
}

export interface ChannelFavoriteToggleParams {
  channel_id: string;
  channel_name: string;
  action: FavoriteAction;
}

export interface ChannelVideoClickParams {
  channel_id: string;
  content_id: number;
  content_type: ContentTypeValue;
  video_id: string;
}

export type ChannelSelectionSource = 'channel_tab' | 'explore_filter';

export interface ChannelSelectionOpenParams {
  current_channel_count: number;
  source: ChannelSelectionSource;
}

export interface ChannelSelectionChangeParams {
  channel_id: string;
  channel_name: string;
  action: 'select' | 'deselect';
}

export interface ChannelSelectionApplyParams {
  selected_count: number;
  changed_count: number;
}

export interface ChannelSelectionReturnParams {
  selected_channel_ids: string[];
  total_selected: number;
}

// ============================================
// 검색 이벤트 파라미터
// ============================================

export interface SearchStartParams {
  source: string;
}

export interface SearchQueryParams {
  search_term: string;
  results_count: number;
}

export interface SearchResultClickParams {
  search_term: string;
  content_id: number;
  content_type: ContentTypeValue;
  position: number;
}

export interface TrendingContentClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  rank: number;
}

// ============================================
// 탐색 이벤트 파라미터
// ============================================

export type ExploreTabName = 'all' | 'latest' | 'popular' | 'recommended';
export type ExploreContentType = 'all' | 'movie' | 'tv';

export interface ExploreTabChangeParams {
  tab_name: ExploreTabName;
}

export interface ExploreFilterApplyParams {
  genres: string[];
  channels: string[];
  content_type: ExploreContentType;
  include_ending: boolean;
  exclude_watched: boolean;
}

export interface ExploreContentClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  tab_name: ExploreTabName;
  position: number;
}

export interface ExploreScrollLoadMoreParams {
  tab_name: ExploreTabName;
  page: number;
  loaded_count: number;
}

// ============================================
// 빠른탐색 이벤트 파라미터
// ============================================

export interface QuickExploreFindParams {
  filter_applied: boolean;
}

export interface QuickExploreContentClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  click_type: 'focused' | 'direct';
}

export interface QuickExploreFilterApplyParams {
  genres: string[];
  channels: string[];
}

export interface QuickExploreFocusAnimationParams {
  content_id: number;
  content_type: ContentTypeValue;
}

export interface QuickExploreFocusAnimationEndParams {
  content_id: number;
  content_type: ContentTypeValue;
  animation_completed: boolean;
}

// ============================================
// 홈 이벤트 파라미터
// ============================================

export interface HomeBannerViewedParams {
  content_id: number;
  content_type: ContentTypeValue;
  banner_index: number;
  view_duration_ms: number;
}

export interface HomeBannerClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  banner_index: number;
}

export type BannerSwipeType = 'manual' | 'auto';

export interface HomeBannerSwipeParams {
  from_index: number;
  to_index: number;
  swipe_type: BannerSwipeType;
}

export type HomeSectionType =
  | 'watch_history'
  | 'recent'
  | 'top10'
  | 'collection'
  | 'long_runtime'
  | 'featured_channel';

export interface HomeSectionClickParams {
  section_type: HomeSectionType;
  content_id: number;
  content_type: ContentTypeValue;
  position: number;
}

export interface HomeSectionMoreClickParams {
  section_type: HomeSectionType;
  destination: string;
}

export interface HomeChannelClickParams {
  channel_id: string;
  channel_name: string;
  position: number;
}

// ============================================
// MY 탭 이벤트 파라미터
// ============================================

export type MyStatType = 'favorites' | 'ratings' | 'watched';

export interface MyStatsClickParams {
  stat_type: MyStatType;
  count: number;
}

export interface MyCalendarDateClickParams {
  date: string;
  watch_count: number;
}

export type CalendarNavigationType = 'swipe' | 'arrow';

export interface MyCalendarMonthChangeParams {
  year: number;
  month: number;
  navigation_type: CalendarNavigationType;
}

export interface MyWatchHistoryClickParams {
  content_id: number;
  content_type: ContentTypeValue;
}

export interface MyNotificationClickParams {
  has_unread: boolean;
}

// ============================================
// 알림 이벤트 파라미터
// ============================================

export interface NotificationListViewParams {
  unread_count: number;
}

export interface NotificationClickParams {
  notification_id: string;
  notification_type: string;
  has_deep_link: boolean;
  deep_link_screen?: string | undefined;
}

export interface NotificationMarkAllReadParams {
  count: number;
}

// ============================================
// 설정 이벤트 파라미터
// ============================================

export interface SettingsNotificationToggleParams {
  enabled: boolean;
}

// ============================================
// 미디어 갤러리 이벤트 파라미터
// ============================================

export interface MediaListViewParams {
  content_id: number;
  content_type: ContentTypeValue;
  total_count: number;
}

export interface MediaImageClickParams {
  content_id: number;
  image_index: number;
}

export interface ImageDetailSwipeParams {
  content_id: number;
  from_index: number;
  to_index: number;
}

export interface ImageZoomParams {
  content_id: number;
  image_index: number;
  zoom_type: 'in' | 'out';
}

// ============================================
// 시청 기록 이벤트 파라미터
// ============================================

export interface WatchHistoryViewParams {
  date_filter: string | null;
  total_count: number;
}

export interface WatchHistoryContentClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  watch_progress: number;
}

export interface WatchHistoryResumeClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  resume_seconds: number;
}

export interface WatchHistoryDeleteParams {
  content_id: number;
  content_type: ContentTypeValue;
}

// ============================================
// 내 콘텐츠 이벤트 파라미터
// ============================================

export type MyCollectionTab = 'favorites' | 'ratings' | 'watched';

export interface MyCollectionViewParams {
  initial_tab: MyCollectionTab;
}

export interface MyCollectionTabChangeParams {
  tab_name: MyCollectionTab;
}

export interface MyCollectionContentClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  rating?: number | undefined;
}

export interface MyCollectionViewModeChangeParams {
  view_mode: 'grid' | 'list';
  tab_name: MyCollectionTab;
}

// ============================================
// UI 인터랙션 이벤트 파라미터
// ============================================

export interface ViewModeChangeParams {
  screen_name: string;
  view_mode: 'card' | 'list';
}

export interface SortChangeParams {
  screen_name: string;
  sort_type: string;
}

export interface LoginPromptShowParams {
  trigger: string;
  screen_name: string;
}

export type LoginPromptAction = 'kakao_login' | 'other_login' | 'close';

export interface LoginPromptActionParams {
  action: LoginPromptAction;
  trigger: string;
  referrer_screen: string;
}

export interface BottomSheetOpenParams {
  sheet_type: string;
  screen_name: string;
}

export interface BottomSheetCloseParams {
  sheet_type: string;
  screen_name: string;
  action_taken: boolean;
}

// ============================================
// 에러 이벤트 파라미터
// ============================================

export type ErrorType = 'api' | 'network' | 'player' | 'unknown';

export interface ErrorOccurredParams {
  error_type: ErrorType;
  error_code: string;
  error_message: string;
  screen_name: string;
}

export interface PlayerErrorParams {
  video_id: string;
  error_code: number;
  fallback_used: boolean;
}

// ============================================
// 콘텐츠 상세 터치 이벤트 파라미터
// ============================================

export interface ContentDetailTabSwitchParams {
  tab_name: 'video_info' | 'related_content';
  content_id: number;
}

export interface ContentDetailChannelClickParams {
  channel_id: string;
  channel_name: string;
  content_id: number;
}

export interface ContentDetailOtherVideoClickParams {
  video_id: string;
  content_id: number;
  content_type: ContentTypeValue;
}

export interface ContentDetailCommentOpenParams {
  content_id: number;
  comment_count: number;
}

export interface ContentDetailMediaClickParams {
  content_id: number;
  content_type: ContentTypeValue;
  image_index: number;
}

export interface ContentDetailRelatedContentClickParams {
  content_id: number;
  related_content_id: number;
  related_content_type: ContentTypeValue;
  position: number;
}

// ============================================
// 이벤트 이름 상수
// ============================================

export const AnalyticsEvent = {
  // 인증
  LOGIN_START: 'login_start',
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGIN_CANCEL: 'login_cancel',
  LOGIN_SKIP: 'login_skip',
  LOGOUT: 'logout',
  ACCOUNT_DELETE: 'account_delete',

  // 프로필
  PROFILE_SETUP_START: 'profile_setup_start',
  PROFILE_SETUP_COMPLETE: 'profile_setup_complete',
  PROFILE_IMAGE_CHANGE: 'profile_image_change',

  // 콘텐츠
  CONTENT_VIEW: 'content_view',
  CONTENT_PLAY_START: 'content_play_start',
  CONTENT_PLAY_END: 'content_play_end',
  CONTENT_FAVORITE_TOGGLE: 'content_favorite_toggle',
  CONTENT_RATING_SUBMIT: 'content_rating_submit',
  CONTENT_SHARE: 'content_share',

  // 채널
  CHANNEL_VIEW: 'channel_view',
  CHANNEL_FAVORITE_TOGGLE: 'channel_favorite_toggle',
  CHANNEL_VIDEO_CLICK: 'channel_video_click',
  CHANNEL_SELECTION_OPEN: 'channel_selection_open',
  CHANNEL_SELECTION_CHANGE: 'channel_selection_change',
  CHANNEL_SELECTION_APPLY: 'channel_selection_apply',
  CHANNEL_SELECTION_RETURN: 'channel_selection_return',

  // 검색
  SEARCH_START: 'search_start',
  SEARCH_QUERY: 'search_query',
  SEARCH_RESULT_CLICK: 'search_result_click',
  TRENDING_CONTENT_CLICK: 'trending_content_click',

  // 탐색
  EXPLORE_TAB_CHANGE: 'explore_tab_change',
  EXPLORE_FILTER_APPLY: 'explore_filter_apply',
  EXPLORE_CONTENT_CLICK: 'explore_content_click',
  EXPLORE_SCROLL_LOAD_MORE: 'explore_scroll_load_more',
  EXPLORE_QUICK_EXPLORE_CLICK: 'explore_quick_explore_click',
  EXPLORE_SEARCH_CLICK: 'explore_search_click',

  // 빠른탐색
  QUICK_EXPLORE_START: 'quick_explore_start',
  QUICK_EXPLORE_FIND: 'quick_explore_find',
  QUICK_EXPLORE_CONTENT_CLICK: 'quick_explore_content_click',
  QUICK_EXPLORE_FILTER_APPLY: 'quick_explore_filter_apply',
  QUICK_EXPLORE_FILTER_RESET: 'quick_explore_filter_reset',
  QUICK_EXPLORE_FOCUS_ANIMATION_START: 'quick_explore_focus_animation_start',
  QUICK_EXPLORE_FOCUS_ANIMATION_END: 'quick_explore_focus_animation_end',

  // 홈
  HOME_BANNER_VIEWED: 'home_banner_viewed',
  HOME_BANNER_CLICK: 'home_banner_click',
  HOME_BANNER_SWIPE: 'home_banner_swipe',
  HOME_SECTION_CLICK: 'home_section_click',
  HOME_SECTION_MORE_CLICK: 'home_section_more_click',
  HOME_CHANNEL_CLICK: 'home_channel_click',

  // MY 탭
  MY_STATS_CLICK: 'my_stats_click',
  MY_CALENDAR_DATE_CLICK: 'my_calendar_date_click',
  MY_CALENDAR_MONTH_CHANGE: 'my_calendar_month_change',
  MY_CALENDAR_TODAY_CLICK: 'my_calendar_today_click',
  MY_WATCH_HISTORY_CLICK: 'my_watch_history_click',
  MY_PROFILE_EDIT_CLICK: 'my_profile_edit_click',
  MY_SETTINGS_CLICK: 'my_settings_click',
  MY_NOTIFICATION_CLICK: 'my_notification_click',

  // 알림
  NOTIFICATION_LIST_VIEW: 'notification_list_view',
  NOTIFICATION_CLICK: 'notification_click',
  NOTIFICATION_MARK_ALL_READ: 'notification_mark_all_read',

  // 설정
  SETTINGS_NOTIFICATION_TOGGLE: 'settings_notification_toggle',
  SETTINGS_FEEDBACK_CLICK: 'settings_feedback_click',
  SETTINGS_PRIVACY_CLICK: 'settings_privacy_click',
  SETTINGS_RATE_APP_CLICK: 'settings_rate_app_click',

  // 미디어 갤러리
  MEDIA_LIST_VIEW: 'media_list_view',
  MEDIA_IMAGE_CLICK: 'media_image_click',
  IMAGE_DETAIL_SWIPE: 'image_detail_swipe',
  IMAGE_ZOOM: 'image_zoom',

  // 시청 기록
  WATCH_HISTORY_VIEW: 'watch_history_view',
  WATCH_HISTORY_CONTENT_CLICK: 'watch_history_content_click',
  WATCH_HISTORY_RESUME_CLICK: 'watch_history_resume_click',
  WATCH_HISTORY_DELETE: 'watch_history_delete',

  // 내 콘텐츠
  MY_COLLECTION_VIEW: 'my_collection_view',
  MY_COLLECTION_TAB_CHANGE: 'my_collection_tab_change',
  MY_COLLECTION_CONTENT_CLICK: 'my_collection_content_click',
  MY_COLLECTION_VIEW_MODE_CHANGE: 'my_collection_view_mode_change',

  // UI 인터랙션
  VIEW_MODE_CHANGE: 'view_mode_change',
  SORT_CHANGE: 'sort_change',
  LOGIN_PROMPT_SHOW: 'login_prompt_show',
  LOGIN_PROMPT_ACTION: 'login_prompt_action',
  BOTTOM_SHEET_OPEN: 'bottom_sheet_open',
  BOTTOM_SHEET_CLOSE: 'bottom_sheet_close',

  // 에러
  ERROR_OCCURRED: 'error_occurred',
  PLAYER_ERROR: 'player_error',

  // 콘텐츠 상세 터치
  CONTENT_DETAIL_TAB_SWITCH: 'content_detail_tab_switch',
  CONTENT_DETAIL_CHANNEL_CLICK: 'content_detail_channel_click',
  CONTENT_DETAIL_OTHER_VIDEO_CLICK: 'content_detail_other_video_click',
  CONTENT_DETAIL_COMMENT_OPEN: 'content_detail_comment_open',
  CONTENT_DETAIL_MEDIA_CLICK: 'content_detail_media_click',
  CONTENT_DETAIL_RELATED_CONTENT_CLICK: 'content_detail_related_content_click',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
