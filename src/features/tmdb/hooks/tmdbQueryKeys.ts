/**
 * TMDB Query Key Factory
 *
 * TMDB 관련 React Query 캐시 키를 중앙 관리합니다.
 * 계층적 구조로 일괄 무효화와 개별 쿼리 관리가 용이합니다.
 *
 * @example
 * // 개별 쿼리
 * queryKey: tmdbKeys.detail(123, 'movie')
 *
 * // TMDB 전체 캐시 무효화
 * queryClient.invalidateQueries({ queryKey: tmdbKeys.all })
 */

import { ContentType } from '@/core/types/content/contentType.enum';

export const tmdbKeys = {
  /** TMDB 루트 키 */
  all: ['tmdb'] as const,

  /** 콘텐츠 상세 정보 */
  detail: (contentId: number, contentType: ContentType) =>
    [...tmdbKeys.all, 'detail', contentType, contentId] as const,

  /** 콘텐츠 이미지 목록 */
  images: (contentId: number, contentType: ContentType) =>
    [...tmdbKeys.all, 'images', contentId, contentType] as const,

  /** 스트리밍 공급처 정보 */
  watchProviders: (contentId: number, contentType: ContentType) =>
    [...tmdbKeys.all, 'watchProviders', contentId, contentType] as const,
};
