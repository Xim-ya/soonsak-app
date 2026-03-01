import { useCallback } from 'react';
import { useFavoritesList, type FavoriteModelType } from '@/features/favorites';
import type { UserContentItem } from '../_types';
import { useInfinitePagination } from './useInfinitePagination';

/**
 * useFavoritesTab - 찜했어요 탭 데이터 Hook
 *
 * 공통 페이지네이션 로직을 사용하고,
 * favorites 데이터를 UserContentItem으로 변환합니다.
 */
export function useFavoritesTab() {
  const mapItem = useCallback(
    (item: FavoriteModelType): UserContentItem => ({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      contentTitle: item.contentTitle,
      contentPosterPath: item.contentPosterPath,
    }),
    [],
  );

  return useInfinitePagination({
    useQueryHook: useFavoritesList,
    mapItem,
  });
}
