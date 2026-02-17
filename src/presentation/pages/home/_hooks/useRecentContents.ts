/**
 * useRecentContents - 최신 콘텐츠 무한 스크롤 훅
 *
 * 최근 업로드된 콘텐츠를 페이지네이션하여 조회합니다.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { ContentDto } from '@/features/content/types';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';

const PAGE_SIZE = 12;

interface RecentContentsResponse {
  contents: ContentDto[];
  hasMore: boolean;
  totalCount: number;
}

interface UseRecentContentsReturn {
  contents: BaseContentModel[];
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useRecentContents(): UseRecentContentsReturn {
  const queryResult = useInfiniteQuery({
    queryKey: ['recentContent'],
    queryFn: async ({ pageParam = 0 }): Promise<RecentContentsResponse> => {
      return contentApi.getRecentUploadedContents(pageParam, PAGE_SIZE);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = queryResult;

  const contents =
    data?.pages.flatMap((page) => page.contents.map(BaseContentModel.fromContentDto)) ?? [];

  return {
    contents,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
