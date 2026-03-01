/**
 * useChannelAll - 전체 채널 목록 무한 스크롤 훅
 *
 * 활성화된 전체 채널 목록을 페이지네이션하여 조회합니다.
 * DTO를 프레젠테이션용 Model로 변환하여 반환합니다.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel/api/channelApi';
import type { ChannelItemModel } from '@/presentation/screens/channel/_types';

const PAGE_SIZE = 20;
const STALE_TIME = 5 * 60 * 1000; // 5분

export function useChannelAll() {
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

  // 모든 페이지의 채널을 평탄화
  const channels = data?.pages.flatMap((page) => page.channels) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    channels,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
  };
}

export type { ChannelItemModel };
