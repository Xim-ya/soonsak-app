/**
 * useChannelList - 채널 목록 조회 훅
 *
 * 채널 선택 UI에 표시할 활성화된 채널 목록을 조회합니다.
 * 찜한 채널이 앞에 표시됩니다.
 */

import { useMemo } from 'react';
import { useChannelListBase } from '@/features/channel';
import { useFavoriteChannelIds } from '@/features/channel-favorites';
import { sortByFavorites } from '@/core/utils/sortByFavorites';
import type { ChannelItemModel } from '../_types';

interface UseChannelListReturn {
  channels: ChannelItemModel[];
  isLoading: boolean;
  error: Error | null;
}

export function useChannelList(): UseChannelListReturn {
  const { data: favoriteIds = [] } = useFavoriteChannelIds();
  const { channels, isLoading, error } = useChannelListBase();

  // 찜한 채널을 앞으로 정렬
  const sortedChannels = useMemo(
    () => sortByFavorites(channels, favoriteIds, (ch) => ch.id),
    [channels, favoriteIds],
  );

  return {
    channels: sortedChannels,
    isLoading,
    error,
  };
}
