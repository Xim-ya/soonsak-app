export const routePages = {
  login: 'Login',
  mainTabs: 'MainTabs',
  contentDetail: 'ContentDetail',
  player: 'Player',
  channelDetail: 'ChannelDetail',
  search: 'Search',
  channelSelection: 'ChannelSelection',
  mediaList: 'MediaList',
  imageDetail: 'ImageDetail',
  profileSetup: 'ProfileSetup',
  settings: 'Settings',
  userContentList: 'UserContentList',
  watchHistory: 'WatchHistory',
  quickExplore: 'QuickExplore',
  adminContentSearch: 'AdminContentSearch',
  adminPrimaryVideoSelect: 'AdminPrimaryVideoSelect',
} as const;

export type RoutePages = typeof routePages;
