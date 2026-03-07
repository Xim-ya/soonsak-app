/**
 * Content API Module
 *
 * God Object였던 contentApi.ts를 기능별로 분리한 모듈입니다.
 * 기존 `contentApi.XXX` 형태의 호출을 유지하면서 내부적으로 분리된 API를 사용합니다.
 *
 * 분리 구조:
 * - contentQueryApi: 기본 콘텐츠 조회 (getRecentUploadedContents, getVideosByContent, searchContentsKorean 등)
 * - contentEngagementApi: 조회수/재생수 (incrementViewCount, incrementPlayCount, getTopContentsByEngagement)
 * - contentTrendingApi: 트렌딩/인기 (getTrendingContents, getSoonsakTopTen, getRecentTrendingContents, getRandomBannerContents)
 * - contentExploreApi: 탐색/필터 (getRandomContents, getFilteredRandomContents, getExploreContents)
 * - contentCollectionApi: 컬렉션 (getContentCollections, getContentsByCollectionIds, getCollectionWithContents)
 * - contentChannelApi: 채널 관련 (getDistinctContentsByChannel, getChannelVideos, getContentsByGenre, getLongRuntimeContents, getCurationVideos)
 */

import { contentQueryApi } from './contentQueryApi';
import { contentEngagementApi } from './contentEngagementApi';
import { contentTrendingApi } from './contentTrendingApi';
import { contentExploreApi } from './contentExploreApi';
import { contentCollectionApi } from './contentCollectionApi';
import { contentChannelApi } from './contentChannelApi';

/**
 * 통합 Content API 객체
 * 기존 코드와의 호환성을 위해 모든 API 메서드를 하나의 객체로 통합합니다.
 */
export const contentApi = {
  // Query API
  getRecentUploadedContents: contentQueryApi.getRecentUploadedContents,
  getVideosByContent: contentQueryApi.getVideosByContent,
  searchContentsKorean: contentQueryApi.searchContentsKorean,
  getRegisteredContentsByTmdbIds: contentQueryApi.getRegisteredContentsByTmdbIds,
  getTotalContentCount: contentQueryApi.getTotalContentCount,
  getContentsByTypeAndIds: contentQueryApi.getContentsByTypeAndIds,

  // Engagement API
  incrementViewCount: contentEngagementApi.incrementViewCount,
  incrementPlayCount: contentEngagementApi.incrementPlayCount,
  getTopContentsByEngagement: contentEngagementApi.getTopContentsByEngagement,

  // Trending API
  getTrendingContents: contentTrendingApi.getTrendingContents,
  getSoonsakTopTen: contentTrendingApi.getSoonsakTopTen,
  getRecentTrendingContents: contentTrendingApi.getRecentTrendingContents,
  getRandomBannerContents: contentTrendingApi.getRandomBannerContents,

  // Explore API
  getRandomContents: contentExploreApi.getRandomContents,
  getFilteredRandomContents: contentExploreApi.getFilteredRandomContents,
  getExploreContents: contentExploreApi.getExploreContents,

  // Collection API
  getContentCollections: contentCollectionApi.getContentCollections,
  getContentsByCollectionIds: contentCollectionApi.getContentsByCollectionIds,
  getCollectionWithContents: contentCollectionApi.getCollectionWithContents,

  // Channel API
  getDistinctContentsByChannel: contentChannelApi.getDistinctContentsByChannel,
  getContentsByGenre: contentChannelApi.getContentsByGenre,
  getLongRuntimeContents: contentChannelApi.getLongRuntimeContents,
  getCurationVideos: contentChannelApi.getCurationVideos,
  getChannelVideos: contentChannelApi.getChannelVideos,
};

// 개별 API 모듈 export (필요 시 직접 import 가능)
export { contentQueryApi } from './contentQueryApi';
export { contentEngagementApi } from './contentEngagementApi';
export { contentTrendingApi } from './contentTrendingApi';
export { contentExploreApi } from './contentExploreApi';
export { contentCollectionApi } from './contentCollectionApi';
export { contentChannelApi } from './contentChannelApi';

// 유틸리티 함수 export (내부 사용 또는 테스트용)
export {
  MAX_EXCLUDE_IDS,
  RPC_THROTTLE_MS,
  shouldThrottleRpc,
  sanitizeExcludeIds,
  getUserWatchedContentIds,
  applyContentFilters,
  mapTrendingRowsToContentDtos,
  isValidContentType,
  isValidTitleLogoLang,
} from './contentApiUtils';

export type { RpcTrendingRow, FilterableQuery } from './contentApiUtils';
