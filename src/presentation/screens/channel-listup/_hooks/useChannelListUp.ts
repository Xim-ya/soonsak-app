/**
 * useChannelListUp - 전체 채널 목록 무한 스크롤 훅
 *
 * 활성화된 전체 채널 목록을 페이지네이션하여 조회합니다.
 * DTO를 프레젠테이션용 Model로 변환하여 반환합니다.
 * 찜한 채널이 앞에 표시됩니다.
 */

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel/api/channelApi';
import { useFavoriteChannelIds } from '@/features/channel-favorites';
import { sortByFavorites } from '@/core/utils/sortByFavorites';
import type { ChannelItemModel } from '@/presentation/screens/channel/_types';

const PAGE_SIZE = 20;
const STALE_TIME = 5 * 60 * 1000; // 5분

export function useChannelListUp() {
  // 찜한 채널 ID 목록 조회
  const { data: favoriteIds = [] } = useFavoriteChannelIds();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['activeChannelsAll'],
      queryFn: async ({ pageParam = 0 }) => {
        const result = await channelApi.getActiveChannelsPaginated(
          pageParam * PAGE_SIZE,
          PAGE_SIZE,
        );

        // DTO → Model 변환
        const channels: ChannelItemModel[] = result.channels.map((ch) => {
          const model: ChannelItemModel = {
            id: ch.id,
            name: ch.name ?? '',
            logoUrl: ch.logoUrl ?? '',
          };
          if (ch.subscriberCount != null) {
            return { ...model, subscriberCount: ch.subscriberCount };
          }
          return model;
        });

        return {
          channels,
          hasMore: result.hasMore,
          totalCount: result.totalCount,
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length : undefined;
      },
      staleTime: STALE_TIME,
    });

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // 모든 페이지의 채널을 평탄화하고 찜한 채널을 앞으로 정렬
  const sortedChannels = useMemo(() => {
    const allChannels = data?.pages.flatMap((page) => page.channels) ?? [];
    return sortByFavorites(allChannels, favoriteIds, (ch) => ch.id);
  }, [data?.pages, favoriteIds]);

  return {
    channels: sortedChannels,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
  };
}

export type { ChannelItemModel };
