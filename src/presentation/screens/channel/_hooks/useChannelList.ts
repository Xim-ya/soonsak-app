/**
 * useChannelList - 채널 목록 조회 훅
 *
 * 채널 선택 UI에 표시할 활성화된 채널 목록을 조회합니다.
 * 찜한 채널이 앞에 표시됩니다.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel/api/channelApi';
import { useFavoriteChannelIds } from '@/features/channel-favorites';
import { sortByFavorites } from '@/shared/utils/sortByFavorites';
import type { ChannelItemModel } from '../_types';

const STALE_TIME = 10 * 60 * 1000; // 10분
const GC_TIME = 30 * 60 * 1000; // 30분

interface UseChannelListReturn {
  channels: ChannelItemModel[];
  isLoading: boolean;
  error: Error | null;
}

export function useChannelList(): UseChannelListReturn {
  // 찜한 채널 ID 목록 조회
  const { data: favoriteIds = [] } = useFavoriteChannelIds();

  const { data, isLoading, error } = useQuery({
    queryKey: ['channelList'],
    queryFn: async () => {
      const channels = await channelApi.getActiveChannels(50); // 최대 50개 채널
      return channels.map((ch) => ({
        id: ch.id,
        name: ch.name ?? '',
        logoUrl: ch.logoUrl ?? '',
        subscriberCount: ch.subscriberCount ?? undefined,
      }));
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // 찜한 채널을 앞으로 정렬
  const sortedChannels = useMemo(
    () => sortByFavorites(data ?? [], favoriteIds, (ch) => ch.id),
    [data, favoriteIds],
  );

  return {
    channels: sortedChannels,
    isLoading,
    error: error as Error | null,
  };
}
