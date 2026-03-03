/**
 * 로그인 화면 진입 경로 상수
 * GA 로깅 시 referrerScreen 파라미터로 사용됩니다.
 */
export const LoginReferrer = {
  // 콘텐츠 상세
  CONTENT_DETAIL_FAVORITE: 'content_detail_favorite',
  CONTENT_DETAIL_RATING: 'content_detail_rating',

  // 채널 상세
  CHANNEL_DETAIL_FAVORITE: 'channel_detail_favorite',

  // 탐색
  EXPLORE_CURATION: 'explore_curation',
  EXPLORE_QUICK: 'explore_quick',

  // MY 탭
  MY_TAB: 'my_tab',

  // 인증 필요 화면 (AuthGuard에서 사용)
  NOTIFICATION_LIST: 'notification_list',
  USER_CONTENT_LIST: 'user_content_list',
  WATCH_HISTORY: 'watch_history',
  SETTINGS: 'settings',

  // 외부 진입
  DEEP_LINK: 'deep_link',
  PUSH_NOTIFICATION: 'push_notification',

  // 기타
  INITIAL: 'initial',
} as const;

export type LoginReferrerType = (typeof LoginReferrer)[keyof typeof LoginReferrer];
