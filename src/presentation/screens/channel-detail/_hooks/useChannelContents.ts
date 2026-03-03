import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { VideoWithContentDto } from '@/features/content/types';
import { getSessionSeed } from '@/shared/utils/sessionSeed';
import type { SortType } from '@/shared/types/sort';
import { ChannelVideoModel } from '../_types';

const PAGE_SIZE = 21;

interface ChannelContentsResponse {
  videos: VideoWithContentDto[];
  hasMore: boolean;
  totalCount: number;
}

interface UseChannelContentsReturn {
  videos: ChannelVideoModel[];
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalCount: number;
}

export function useChannelContents(
  channelId: string,
  sortType: SortType = 'all',
): UseChannelContentsReturn {
  // 랜덤 정렬용 세션 시드
  const sessionSeed = getSessionSeed();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['channelVideos', channelId, sortType, sessionSeed],
      queryFn: async ({ pageParam = 0 }): Promise<ChannelContentsResponse> => {
        return contentApi.getDistinctContentsByChannel(channelId, pageParam, PAGE_SIZE, sortType);
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage: ChannelContentsResponse, pages) => {
        return lastPage.hasMore ? pages.length : undefined;
      },
      enabled: !!channelId,
      staleTime: 5 * 60 * 1000,
    });

  const videos = data?.pages.flatMap((page) => ChannelVideoModel.fromDtoList(page.videos)) ?? [];
  // 첫 번째 페이지에서 전체 콘텐츠 수를 가져옴
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    videos,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
  };
}
