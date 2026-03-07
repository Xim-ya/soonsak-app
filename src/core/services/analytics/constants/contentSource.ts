/**
 * 콘텐츠 상세 화면 진입 경로 상수
 * GA 로깅 시 source 파라미터로 사용됩니다.
 */
export const ContentSource = {
  // 홈 화면
  HOME_BANNER: 'home_banner',
  HOME_WATCH_HISTORY: 'home_watch_history',
  HOME_RECENT: 'home_recent',
  HOME_TOP10: 'home_top10',
  HOME_COLLECTION: 'home_collection',
  HOME_LONG_RUNTIME: 'home_long_runtime',

  // 탐색 화면
  EXPLORE_GRID: 'explore_grid',
  EXPLORE_CURATION: 'explore_curation',

  // 검색 화면
  SEARCH_RESULT: 'search_result',
  SEARCH_TRENDING: 'search_trending',

  // 빠른탐색
  QUICK_EXPLORE: 'quick_explore',

  // 채널
  CHANNEL_TAB: 'channel_tab',
  CHANNEL_DETAIL: 'channel_detail',

  // MY 탭
  MY_WATCH_HISTORY: 'my_watch_history',
  MY_CALENDAR: 'my_calendar',
  MY_COLLECTION: 'my_collection',

  // 시청 기록
  WATCH_HISTORY: 'watch_history',

  // 알림
  NOTIFICATION: 'notification',
} as const;

export type ContentSourceType = (typeof ContentSource)[keyof typeof ContentSource];
