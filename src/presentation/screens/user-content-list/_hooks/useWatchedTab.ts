import { useCallback } from 'react';
import { useFullyWatchedList, type WatchHistoryModelType } from '@/features/watch-history';
import type { UserContentItem } from '../_types';
import { useInfinitePagination } from './useInfinitePagination';

/**
 * useWatchedTab - 봤어요 탭 데이터 Hook
 *
 * 공통 페이지네이션 로직을 사용하고,
 * watch-history 데이터를 UserContentItem으로 변환합니다.
 */
export function useWatchedTab() {
  const mapItem = useCallback(
    (item: WatchHistoryModelType): UserContentItem => ({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      contentTitle: item.contentTitle,
      contentPosterPath: item.contentPosterPath,
    }),
    [],
  );

  return useInfinitePagination({
    useQueryHook: useFullyWatchedList,
    mapItem,
  });
}
