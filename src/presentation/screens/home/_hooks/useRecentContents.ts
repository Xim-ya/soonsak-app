/**
 * useRecentContents - 최신 콘텐츠 무한 스크롤 훅
 *
 * 최근 업로드된 콘텐츠를 페이지네이션하여 조회합니다.
 */

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api';
import { ContentDto } from '@/features/content/types';
import { BaseContentModel } from '@/core/types/content/baseContentModel';

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

  // 중복 제거 (id + type 기준) - useMemo로 최적화
  const contents = useMemo(() => {
    if (!data?.pages) return [];
    const allContents = data.pages.flatMap((page) =>
      page.contents.map(BaseContentModel.fromContentDto),
    );
    const seen = new Set<string>();
    return allContents.filter((item) => {
      const key = `${item.id}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.pages]);

  return {
    contents,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
