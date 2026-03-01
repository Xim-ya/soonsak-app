import { useCallback } from 'react';
import { useRatingsList, type RatingModelType } from '@/features/ratings';
import type { UserContentItem } from '../_types';
import { useInfinitePagination } from './useInfinitePagination';

/**
 * useRatingsTab - 평가했어요 탭 데이터 Hook
 *
 * 공통 페이지네이션 로직을 사용하고,
 * ratings 데이터를 UserContentItem으로 변환합니다.
 * rating 필드를 추가로 매핑합니다.
 */
export function useRatingsTab() {
  const mapItem = useCallback(
    (item: RatingModelType): UserContentItem => ({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      contentTitle: item.contentTitle,
      contentPosterPath: item.contentPosterPath,
      rating: item.rating,
    }),
    [],
  );

  return useInfinitePagination({
    useQueryHook: useRatingsList,
    mapItem,
  });
}
