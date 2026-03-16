/**
 * useChannelListUp - 전체 채널 목록 무한 스크롤 훅
 *
 * useChannelListBase를 확장하여 찜한 채널을 앞에 표시합니다.
 */

import { useMemo } from 'react';
import { useChannelListBase, type ChannelListItem } from '@/features/channel';
import { useFavoriteChannelIds } from '@/features/channel-favorites';
import { sortByFavorites } from '@/core/utils/sortByFavorites';

export type ChannelItemModel = ChannelListItem;

export function useChannelListUp() {
  const { data: favoriteIds = [] } = useFavoriteChannelIds();

  const { channels, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, totalCount } =
    useChannelListBase();

  // 찜한 채널을 앞으로 정렬
  const sortedChannels = useMemo(
    () => sortByFavorites(channels, favoriteIds, (ch) => ch.id),
    [channels, favoriteIds],
  );

  return {
    channels: sortedChannels,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    totalCount,
  };
}
