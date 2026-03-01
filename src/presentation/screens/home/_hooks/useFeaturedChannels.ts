import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel';
import { CHANNEL_DATABASE } from '@/features/utils/constants/dbConfig';
import {
  FeaturedChannelModel,
  UseFeaturedChannelsResult,
} from '../_types/featuredChannelModel.home';

const QUERY_KEY = 'featuredChannels';
const STALE_TIME_MS = 10 * 60 * 1000;
const GC_TIME_MS = 30 * 60 * 1000;

/**
 * 대표 채널 목록 조회 훅
 *
 * 동작:
 * - Supabase RPC로 랜덤 활성 채널 목록 조회 (최대 12개)
 * - DB에서 logoUrl, subscriberCount 직접 사용
 *
 * Flutter: HomeViewModel._fetchChannelList() 참고
 */
export function useFeaturedChannels(): UseFeaturedChannelsResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEY, 'list'],
    queryFn: () => channelApi.getRandomActiveChannels(CHANNEL_DATABASE.LIMITS.DEFAULT_RANDOM),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  });

  // ChannelDto → FeaturedChannelModel 변환
  const channels = useMemo((): FeaturedChannelModel[] => {
    if (!data) return [];

    return data
      .filter((ch) => ch.logoUrl) // logoUrl 없는 채널 필터링
      .map((ch) => ({
        id: ch.id,
        name: ch.name ?? '채널',
        logoUrl: ch.logoUrl!,
        subscriberCount: ch.subscriberCount ?? 0,
      }));
  }, [data]);

  return {
    data: channels,
    isLoading,
    isError,
  };
}
