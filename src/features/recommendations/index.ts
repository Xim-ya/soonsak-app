/**
 * 개인화 추천 모듈
 *
 * 사용자의 시청 기록, 평점, 찜 데이터를 기반으로
 * 개인화된 콘텐츠 추천을 제공합니다.
 *
 * @example
 * // 장르 선호도 조회
 * const { data: preferences } = useGenrePreferences();
 *
 * // 개인화 추천 (무한 스크롤)
 * const { data, fetchNextPage, hasNextPage } = usePersonalizedRecommendations();
 *
 * // 개인화 추천 (단일 페이지)
 * const { data } = usePersonalizedRecommendationsPage(10);
 */

// API
export { recommendationsApi } from './api/recommendationsApi';

// Hooks
export {
  useGenrePreferences,
  usePersonalizedRecommendations,
  usePersonalizedRecommendationsPage,
  usePersonalizedCurationVideos,
  recommendationKeys,
} from './hooks/useRecommendations';

// Types
export type {
  GenrePreferenceDto,
  RecommendedContentDto,
  PersonalizedRecommendationsResponse,
} from './types';

// Models
export { GenrePreferenceModel, RecommendedContentModel } from './types/recommendationModel';
