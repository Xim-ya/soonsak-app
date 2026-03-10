/**
 * useChannelListBase - 채널 목록 조회 기본 훅
 *
 * 활성화된 채널 목록을 페이지네이션하여 조회합니다.
 * DTO를 프레젠테이션용 Model로 변환하여 반환합니다.
 *
 * 이 훅을 기반으로:
 * - useChannelListUp: 찜한 채널 정렬 추가
 * - useChannelSelection: 선택 상태 관리 추가
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { channelApi } from '../api/channelApi';

const PAGE_SIZE = 21;
const STALE_TIME = 5 * 60 * 1000; // 5분

export interface ChannelListItem {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly subscriberCount?: number;
}

interface UseChannelListBaseReturn {
  readonly channels: ChannelListItem[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly totalCount: number;
}

export function useChannelListBase(): UseChannelListBaseReturn {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['activeChannelsAll'],
      queryFn: async ({ pageParam = 0 }) => {
        const result = await channelApi.getActiveChannelsPaginated(
          pageParam * PAGE_SIZE,
          PAGE_SIZE,
        );

        // DTO → Model 변환
        const channels: ChannelListItem[] = result.channels.map((ch) => ({
          id: ch.id,
          name: ch.name ?? '',
          logoUrl: ch.logoUrl ?? '',
          ...(ch.subscriberCount != null && { subscriberCount: ch.subscriberCount }),
        }));

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
  const allChannels = data?.pages.flatMap((page) => page.channels) ?? [];

  return {
    channels: allChannels,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
  };
}
