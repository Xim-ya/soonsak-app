/**
 * useExploreContents - 탐색 화면용 콘텐츠 무한 스크롤 훅
 *
 * 정렬 및 필터 조건에 따라 콘텐츠를 페이지네이션하여 조회합니다.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api';
import { ContentDto } from '@/features/content/types';
import type { ContentFilter } from '@/core/types/filter/contentFilter';
import { getSessionSeed } from '@/core/utils/sessionSeed';
import type { ExploreSortType, ExploreContentModel } from '../_types/exploreTypes';

const PAGE_SIZE = 20;

interface ExploreContentsResponse {
  contents: ContentDto[];
  hasMore: boolean;
  totalCount: number;
}

interface UseExploreContentsReturn {
  contents: ExploreContentModel[];
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalCount: number;
  refetch: () => void;
}

/** ContentDto를 ExploreContentModel로 변환 (한국어 로고만 사용) */
function toExploreContentModel(dto: ContentDto): ExploreContentModel {
  // 한국어 로고만 사용, 영어는 undefined 처리
  const isKoreanLogo = dto.titleLogoLang === 'ko';

  return {
    id: dto.id,
    title: dto.title,
    type: dto.contentType,
    posterPath: dto.posterPath,
    backdropPath: dto.backdropPath,
    titleLogo: isKoreanLogo ? dto.titleLogo : undefined,
    titleLogoLang: isKoreanLogo ? dto.titleLogoLang : undefined,
  };
}

/** 필터를 queryKey로 변환하기 위한 직렬화 */
function serializeFilter(filter: ContentFilter): string {
  return JSON.stringify({
    contentType: filter.contentType,
    genreIds: filter.genreIds,
    countryCodes: filter.countryCodes,
    releaseYearRange: filter.releaseYearRange,
    minStarRating: filter.minStarRating,
    includeEnding: filter.includeEnding,
    channelIds: filter.channelIds,
    excludeWatched: filter.excludeWatched,
  });
}

interface UseExploreContentsOptions {
  /** 쿼리 활성화 여부 (lazy 로딩용) */
  enabled?: boolean;
  /** 탐색 시드 (화면 진입/앱 복귀 시마다 새로 생성) */
  exploreSeed?: number;
}

export function useExploreContents(
  sortType: ExploreSortType,
  filter: ContentFilter,
  options?: UseExploreContentsOptions,
): UseExploreContentsReturn {
  const { enabled = true, exploreSeed } = options ?? {};
  const filterKey = serializeFilter(filter);

  // 탐색 시드: 'all' 정렬에서만 사용 (다른 정렬에서는 캐시 무효화 방지)
  const seed = sortType === 'all' ? (exploreSeed ?? getSessionSeed()) : undefined;

  const queryResult = useInfiniteQuery({
    // seed는 sortType === 'all'일 때만 queryKey에 포함 (불필요한 캐시 무효화 방지)
    queryKey: ['exploreContents', sortType, filterKey, ...(seed ? [seed] : [])],
    queryFn: async ({ pageParam = 0 }): Promise<ExploreContentsResponse> => {
      return contentApi.getExploreContents(
        sortType,
        filter,
        pageParam,
        PAGE_SIZE,
        sortType === 'all' ? seed : undefined,
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    queryResult;

  const contents = data?.pages.flatMap((page) => page.contents.map(toExploreContentModel)) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    contents,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
    refetch,
  };
}
