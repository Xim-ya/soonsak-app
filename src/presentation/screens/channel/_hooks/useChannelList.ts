/**
 * useChannelList - 채널 목록 조회 훅
 *
 * 채널 선택 UI에 표시할 활성화된 채널 목록을 조회합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel/api/channelApi';
import type { ChannelItemModel } from '../_types';

const STALE_TIME = 10 * 60 * 1000; // 10분
const GC_TIME = 30 * 60 * 1000; // 30분

interface UseChannelListReturn {
  channels: ChannelItemModel[];
  isLoading: boolean;
  error: Error | null;
}

export function useChannelList(): UseChannelListReturn {
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

  return {
    channels: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
