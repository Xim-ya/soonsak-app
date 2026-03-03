/**
 * GA4 Analytics 서비스
 *
 * Firebase Analytics를 사용하여 이벤트를 로깅합니다.
 * 개발 환경에서는 콘솔에 로깅하고, 프로덕션에서는 실제 전송합니다.
 */

import analytics from '@react-native-firebase/analytics';
import {
  AnalyticsEvent,
  type AnalyticsEventName,
  type LoginStartParams,
  type LoginAttemptParams,
  type LoginSuccessParams,
  type LoginFailureParams,
  type LoginCancelParams,
  type LoginSkipParams,
  type ProfileSetupStartParams,
  type ProfileSetupCompleteParams,
  type ProfileImageChangeParams,
  type ContentViewParams,
  type ContentPlayStartParams,
  type ContentPlayEndParams,
  type ContentFavoriteToggleParams,
  type ContentRatingSubmitParams,
  type ChannelViewParams,
  type ChannelFavoriteToggleParams,
  type ChannelVideoClickParams,
  type ChannelSelectionOpenParams,
  type ChannelSelectionChangeParams,
  type ChannelSelectionApplyParams,
  type SearchStartParams,
  type SearchQueryParams,
  type SearchResultClickParams,
  type TrendingContentClickParams,
  type ExploreTabChangeParams,
  type ExploreFilterApplyParams,
  type ExploreContentClickParams,
  type QuickExploreFindParams,
  type QuickExploreContentClickParams,
  type QuickExploreFilterApplyParams,
  type QuickExploreFocusAnimationParams,
  type QuickExploreFocusAnimationEndParams,
  type HomeBannerViewedParams,
  type HomeBannerClickParams,
  type HomeBannerSwipeParams,
  type HomeSectionClickParams,
  type HomeSectionMoreClickParams,
  type HomeChannelClickParams,
  type MyStatsClickParams,
  type MyCalendarDateClickParams,
  type MyCalendarMonthChangeParams,
  type MyWatchHistoryClickParams,
  type MyNotificationClickParams,
  type NotificationListViewParams,
  type NotificationClickParams,
  type NotificationMarkAllReadParams,
  type SettingsNotificationToggleParams,
  type MediaListViewParams,
  type MediaImageClickParams,
  type ImageDetailSwipeParams,
  type WatchHistoryViewParams,
  type WatchHistoryContentClickParams,
  type WatchHistoryResumeClickParams,
  type WatchHistoryDeleteParams,
  type MyCollectionViewParams,
  type MyCollectionTabChangeParams,
  type MyCollectionContentClickParams,
  type LoginPromptShowParams,
  type LoginPromptActionParams,
  type BottomSheetOpenParams,
  type BottomSheetCloseParams,
  type ErrorOccurredParams,
  type PlayerErrorParams,
  type ContentDetailTabSwitchParams,
  type ContentDetailChannelClickParams,
  type ContentDetailOtherVideoClickParams,
  type ContentDetailCommentOpenParams,
  type ContentDetailMediaClickParams,
  type ContentDetailRelatedContentClickParams,
} from '../types/events';

/**
 * 이벤트 파라미터 타입 (배열 값을 문자열로 변환)
 */
type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * 배열 값을 JSON 문자열로 변환
 */
function serializeParams<T extends object>(params: T): EventParams {
  const result: EventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      result[key] = JSON.stringify(value);
    } else if (value !== undefined) {
      result[key] = value as string | number | boolean;
    }
  }
  return result;
}

/**
 * 기본 이벤트 로깅 함수
 * 개발 환경에서는 콘솔 로그만 출력하고 실제 전송하지 않음
 */
async function logEvent(eventName: AnalyticsEventName, params?: EventParams): Promise<void> {
  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, params ?? {});
    return;
  }

  // Fire and forget - 비동기로 전송하되 기다리지 않음
  analytics().logEvent(eventName, params);
}

/**
 * 화면 조회 로깅 함수
 */
async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  if (__DEV__) {
    console.log(`[Analytics] screen_view: ${screenName}`);
    return;
  }

  analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass ?? screenName,
  });
}

/**
 * GA4 Analytics 서비스
 */
export const analyticsService = {
  // ============================================
  // 인증 이벤트
  // ============================================

  loginStart: (params: LoginStartParams) =>
    logEvent(AnalyticsEvent.LOGIN_START, serializeParams(params)),

  loginAttempt: (params: LoginAttemptParams) =>
    logEvent(AnalyticsEvent.LOGIN_ATTEMPT, serializeParams(params)),

  loginSuccess: (params: LoginSuccessParams) =>
    logEvent(AnalyticsEvent.LOGIN_SUCCESS, serializeParams(params)),

  loginFailure: (params: LoginFailureParams) =>
    logEvent(AnalyticsEvent.LOGIN_FAILURE, serializeParams(params)),

  loginCancel: (params: LoginCancelParams) =>
    logEvent(AnalyticsEvent.LOGIN_CANCEL, serializeParams(params)),

  loginSkip: (params: LoginSkipParams) =>
    logEvent(AnalyticsEvent.LOGIN_SKIP, serializeParams(params)),

  logout: () => logEvent(AnalyticsEvent.LOGOUT),

  accountDelete: () => logEvent(AnalyticsEvent.ACCOUNT_DELETE),

  // ============================================
  // 프로필 이벤트
  // ============================================

  profileSetupStart: (params: ProfileSetupStartParams) =>
    logEvent(AnalyticsEvent.PROFILE_SETUP_START, serializeParams(params)),

  profileSetupComplete: (params: ProfileSetupCompleteParams) =>
    logEvent(AnalyticsEvent.PROFILE_SETUP_COMPLETE, serializeParams(params)),

  profileImageChange: (params: ProfileImageChangeParams) =>
    logEvent(AnalyticsEvent.PROFILE_IMAGE_CHANGE, serializeParams(params)),

  // ============================================
  // 콘텐츠 이벤트
  // ============================================

  contentView: (params: ContentViewParams) =>
    logEvent(AnalyticsEvent.CONTENT_VIEW, serializeParams(params)),

  contentPlayStart: (params: ContentPlayStartParams) =>
    logEvent(AnalyticsEvent.CONTENT_PLAY_START, serializeParams(params)),

  contentPlayEnd: (params: ContentPlayEndParams) =>
    logEvent(AnalyticsEvent.CONTENT_PLAY_END, serializeParams(params)),

  contentFavoriteToggle: (params: ContentFavoriteToggleParams) =>
    logEvent(AnalyticsEvent.CONTENT_FAVORITE_TOGGLE, serializeParams(params)),

  contentRatingSubmit: (params: ContentRatingSubmitParams) =>
    logEvent(AnalyticsEvent.CONTENT_RATING_SUBMIT, serializeParams(params)),

  // ============================================
  // 채널 이벤트
  // ============================================

  channelView: (params: ChannelViewParams) =>
    logEvent(AnalyticsEvent.CHANNEL_VIEW, serializeParams(params)),

  channelFavoriteToggle: (params: ChannelFavoriteToggleParams) =>
    logEvent(AnalyticsEvent.CHANNEL_FAVORITE_TOGGLE, serializeParams(params)),

  channelVideoClick: (params: ChannelVideoClickParams) =>
    logEvent(AnalyticsEvent.CHANNEL_VIDEO_CLICK, serializeParams(params)),

  channelSelectionOpen: (params: ChannelSelectionOpenParams) =>
    logEvent(AnalyticsEvent.CHANNEL_SELECTION_OPEN, serializeParams(params)),

  channelSelectionChange: (params: ChannelSelectionChangeParams) =>
    logEvent(AnalyticsEvent.CHANNEL_SELECTION_CHANGE, serializeParams(params)),

  channelSelectionApply: (params: ChannelSelectionApplyParams) =>
    logEvent(AnalyticsEvent.CHANNEL_SELECTION_APPLY, serializeParams(params)),

  // ============================================
  // 검색 이벤트
  // ============================================

  searchStart: (params: SearchStartParams) =>
    logEvent(AnalyticsEvent.SEARCH_START, serializeParams(params)),

  searchQuery: (params: SearchQueryParams) =>
    logEvent(AnalyticsEvent.SEARCH_QUERY, serializeParams(params)),

  searchResultClick: (params: SearchResultClickParams) =>
    logEvent(AnalyticsEvent.SEARCH_RESULT_CLICK, serializeParams(params)),

  trendingContentClick: (params: TrendingContentClickParams) =>
    logEvent(AnalyticsEvent.TRENDING_CONTENT_CLICK, serializeParams(params)),

  // ============================================
  // 탐색 이벤트
  // ============================================

  exploreTabChange: (params: ExploreTabChangeParams) =>
    logEvent(AnalyticsEvent.EXPLORE_TAB_CHANGE, serializeParams(params)),

  exploreFilterApply: (params: ExploreFilterApplyParams) =>
    logEvent(AnalyticsEvent.EXPLORE_FILTER_APPLY, serializeParams(params)),

  exploreContentClick: (params: ExploreContentClickParams) =>
    logEvent(AnalyticsEvent.EXPLORE_CONTENT_CLICK, serializeParams(params)),

  exploreQuickExploreClick: () => logEvent(AnalyticsEvent.EXPLORE_QUICK_EXPLORE_CLICK),

  exploreSearchClick: () => logEvent(AnalyticsEvent.EXPLORE_SEARCH_CLICK),

  // ============================================
  // 빠른탐색 이벤트
  // ============================================

  quickExploreStart: () => logEvent(AnalyticsEvent.QUICK_EXPLORE_START),

  quickExploreFind: (params: QuickExploreFindParams) =>
    logEvent(AnalyticsEvent.QUICK_EXPLORE_FIND, serializeParams(params)),

  quickExploreContentClick: (params: QuickExploreContentClickParams) =>
    logEvent(AnalyticsEvent.QUICK_EXPLORE_CONTENT_CLICK, serializeParams(params)),

  quickExploreFilterApply: (params: QuickExploreFilterApplyParams) =>
    logEvent(AnalyticsEvent.QUICK_EXPLORE_FILTER_APPLY, serializeParams(params)),

  quickExploreFilterReset: () => logEvent(AnalyticsEvent.QUICK_EXPLORE_FILTER_RESET),

  quickExploreFocusAnimationStart: (params: QuickExploreFocusAnimationParams) =>
    logEvent(AnalyticsEvent.QUICK_EXPLORE_FOCUS_ANIMATION_START, serializeParams(params)),

  quickExploreFocusAnimationEnd: (params: QuickExploreFocusAnimationEndParams) =>
    logEvent(AnalyticsEvent.QUICK_EXPLORE_FOCUS_ANIMATION_END, serializeParams(params)),

  // ============================================
  // 홈 이벤트
  // ============================================

  homeBannerViewed: (params: HomeBannerViewedParams) =>
    logEvent(AnalyticsEvent.HOME_BANNER_VIEWED, serializeParams(params)),

  homeBannerClick: (params: HomeBannerClickParams) =>
    logEvent(AnalyticsEvent.HOME_BANNER_CLICK, serializeParams(params)),

  homeBannerSwipe: (params: HomeBannerSwipeParams) =>
    logEvent(AnalyticsEvent.HOME_BANNER_SWIPE, serializeParams(params)),

  homeSectionClick: (params: HomeSectionClickParams) =>
    logEvent(AnalyticsEvent.HOME_SECTION_CLICK, serializeParams(params)),

  homeSectionMoreClick: (params: HomeSectionMoreClickParams) =>
    logEvent(AnalyticsEvent.HOME_SECTION_MORE_CLICK, serializeParams(params)),

  homeChannelClick: (params: HomeChannelClickParams) =>
    logEvent(AnalyticsEvent.HOME_CHANNEL_CLICK, serializeParams(params)),

  // ============================================
  // MY 탭 이벤트
  // ============================================

  myStatsClick: (params: MyStatsClickParams) =>
    logEvent(AnalyticsEvent.MY_STATS_CLICK, serializeParams(params)),

  myCalendarDateClick: (params: MyCalendarDateClickParams) =>
    logEvent(AnalyticsEvent.MY_CALENDAR_DATE_CLICK, serializeParams(params)),

  myCalendarMonthChange: (params: MyCalendarMonthChangeParams) =>
    logEvent(AnalyticsEvent.MY_CALENDAR_MONTH_CHANGE, serializeParams(params)),

  myCalendarTodayClick: () => logEvent(AnalyticsEvent.MY_CALENDAR_TODAY_CLICK),

  myWatchHistoryClick: (params: MyWatchHistoryClickParams) =>
    logEvent(AnalyticsEvent.MY_WATCH_HISTORY_CLICK, serializeParams(params)),

  myProfileEditClick: () => logEvent(AnalyticsEvent.MY_PROFILE_EDIT_CLICK),

  mySettingsClick: () => logEvent(AnalyticsEvent.MY_SETTINGS_CLICK),

  myNotificationClick: (params: MyNotificationClickParams) =>
    logEvent(AnalyticsEvent.MY_NOTIFICATION_CLICK, serializeParams(params)),

  // ============================================
  // 알림 이벤트
  // ============================================

  notificationListView: (params: NotificationListViewParams) =>
    logEvent(AnalyticsEvent.NOTIFICATION_LIST_VIEW, serializeParams(params)),

  notificationClick: (params: NotificationClickParams) =>
    logEvent(AnalyticsEvent.NOTIFICATION_CLICK, serializeParams(params)),

  notificationMarkAllRead: (params: NotificationMarkAllReadParams) =>
    logEvent(AnalyticsEvent.NOTIFICATION_MARK_ALL_READ, serializeParams(params)),

  // ============================================
  // 설정 이벤트
  // ============================================

  settingsNotificationToggle: (params: SettingsNotificationToggleParams) =>
    logEvent(AnalyticsEvent.SETTINGS_NOTIFICATION_TOGGLE, serializeParams(params)),

  settingsFeedbackClick: () => logEvent(AnalyticsEvent.SETTINGS_FEEDBACK_CLICK),

  settingsPrivacyClick: () => logEvent(AnalyticsEvent.SETTINGS_PRIVACY_CLICK),

  settingsRateAppClick: () => logEvent(AnalyticsEvent.SETTINGS_RATE_APP_CLICK),

  // ============================================
  // 미디어 갤러리 이벤트
  // ============================================

  mediaListView: (params: MediaListViewParams) =>
    logEvent(AnalyticsEvent.MEDIA_LIST_VIEW, serializeParams(params)),

  mediaImageClick: (params: MediaImageClickParams) =>
    logEvent(AnalyticsEvent.MEDIA_IMAGE_CLICK, serializeParams(params)),

  imageDetailSwipe: (params: ImageDetailSwipeParams) =>
    logEvent(AnalyticsEvent.IMAGE_DETAIL_SWIPE, serializeParams(params)),

  // ============================================
  // 시청 기록 이벤트
  // ============================================

  watchHistoryView: (params: WatchHistoryViewParams) =>
    logEvent(AnalyticsEvent.WATCH_HISTORY_VIEW, serializeParams(params)),

  watchHistoryContentClick: (params: WatchHistoryContentClickParams) =>
    logEvent(AnalyticsEvent.WATCH_HISTORY_CONTENT_CLICK, serializeParams(params)),

  watchHistoryResumeClick: (params: WatchHistoryResumeClickParams) =>
    logEvent(AnalyticsEvent.WATCH_HISTORY_RESUME_CLICK, serializeParams(params)),

  watchHistoryDelete: (params: WatchHistoryDeleteParams) =>
    logEvent(AnalyticsEvent.WATCH_HISTORY_DELETE, serializeParams(params)),

  // ============================================
  // 내 콘텐츠 이벤트
  // ============================================

  myCollectionView: (params: MyCollectionViewParams) =>
    logEvent(AnalyticsEvent.MY_COLLECTION_VIEW, serializeParams(params)),

  myCollectionTabChange: (params: MyCollectionTabChangeParams) =>
    logEvent(AnalyticsEvent.MY_COLLECTION_TAB_CHANGE, serializeParams(params)),

  myCollectionContentClick: (params: MyCollectionContentClickParams) =>
    logEvent(AnalyticsEvent.MY_COLLECTION_CONTENT_CLICK, serializeParams(params)),

  // ============================================
  // UI 인터랙션 이벤트
  // ============================================

  loginPromptShow: (params: LoginPromptShowParams) =>
    logEvent(AnalyticsEvent.LOGIN_PROMPT_SHOW, serializeParams(params)),

  loginPromptAction: (params: LoginPromptActionParams) =>
    logEvent(AnalyticsEvent.LOGIN_PROMPT_ACTION, serializeParams(params)),

  bottomSheetOpen: (params: BottomSheetOpenParams) =>
    logEvent(AnalyticsEvent.BOTTOM_SHEET_OPEN, serializeParams(params)),

  bottomSheetClose: (params: BottomSheetCloseParams) =>
    logEvent(AnalyticsEvent.BOTTOM_SHEET_CLOSE, serializeParams(params)),

  // ============================================
  // 에러 이벤트
  // ============================================

  errorOccurred: (params: ErrorOccurredParams) =>
    logEvent(AnalyticsEvent.ERROR_OCCURRED, serializeParams(params)),

  playerError: (params: PlayerErrorParams) =>
    logEvent(AnalyticsEvent.PLAYER_ERROR, serializeParams(params)),

  // ============================================
  // 콘텐츠 상세 터치 이벤트
  // ============================================

  contentDetailTabSwitch: (params: ContentDetailTabSwitchParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_TAB_SWITCH, serializeParams(params)),

  contentDetailChannelClick: (params: ContentDetailChannelClickParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_CHANNEL_CLICK, serializeParams(params)),

  contentDetailOtherVideoClick: (params: ContentDetailOtherVideoClickParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_OTHER_VIDEO_CLICK, serializeParams(params)),

  contentDetailCommentOpen: (params: ContentDetailCommentOpenParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_COMMENT_OPEN, serializeParams(params)),

  contentDetailMediaClick: (params: ContentDetailMediaClickParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_MEDIA_CLICK, serializeParams(params)),

  contentDetailRelatedContentClick: (params: ContentDetailRelatedContentClickParams) =>
    logEvent(AnalyticsEvent.CONTENT_DETAIL_RELATED_CONTENT_CLICK, serializeParams(params)),

  // ============================================
  // 화면 조회 이벤트
  // ============================================

  screenView: (screenName: string, screenClass?: string) => logScreenView(screenName, screenClass),
};
