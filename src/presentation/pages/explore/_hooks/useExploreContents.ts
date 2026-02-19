/**
 * useExploreContents - 탐색 화면용 콘텐츠 무한 스크롤 훅
 *
 * 정렬 및 필터 조건에 따라 콘텐츠를 페이지네이션하여 조회합니다.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { ContentDto } from '@/features/content/types';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import { getSessionSeed } from '@/shared/utils/sessionSeed';
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
    posterPath: dto.posterPath ?? '',
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

export function useExploreContents(
  sortType: ExploreSortType,
  filter: ContentFilter,
): UseExploreContentsReturn {
  // 'recommended'는 현재 비활성이므로 'all'로 폴백
  const effectiveSortType = sortType === 'recommended' ? 'all' : sortType;
  const filterKey = serializeFilter(filter);

  // 세션 시드 (앱 재시작 시마다 새로 생성, 'all' 정렬에서 사용)
  const sessionSeed = getSessionSeed();

  const queryResult = useInfiniteQuery({
    queryKey: ['exploreContents', effectiveSortType, filterKey, sessionSeed],
    queryFn: async ({ pageParam = 0 }): Promise<ExploreContentsResponse> => {
      return contentApi.getExploreContents(
        effectiveSortType,
        filter,
        pageParam,
        PAGE_SIZE,
        effectiveSortType === 'all' ? sessionSeed : undefined,
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
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
