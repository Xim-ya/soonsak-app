/**
 * useChannelVideos - 채널 페이지용 비디오 무한 스크롤 훅
 *
 * 선택된 채널 필터와 정렬 조건에 따라 비디오를 페이지네이션하여 조회합니다.
 */

import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { getSessionSeed } from '@/shared/utils/sessionSeed';
import { TMDB_GENRE_MAP } from '@/features/content/constants/genreConstants';
import type { ChannelSortType, ChannelVideoModel } from '../_types';

const PAGE_SIZE = 20;

/** 가운데 점 구분자 */
const DOT_SEPARATOR = '·';

/** 날짜 문자열에서 연도 추출 */
function extractYear(dateString?: string): string {
  if (!dateString) return '';
  return dateString.slice(0, 4);
}

/** 장르 ID 배열을 이름 문자열로 변환 (최대 2개) */
function formatGenres(genreIds?: number[]): string {
  if (!genreIds || genreIds.length === 0) return '';
  return genreIds
    .slice(0, 2)
    .map((id) => TMDB_GENRE_MAP[id])
    .filter(Boolean)
    .join(DOT_SEPARATOR);
}

interface UseChannelVideosReturn {
  videos: ChannelVideoModel[];
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useChannelVideos(
  selectedChannelIds: string[],
  sortType: ChannelSortType,
  includeEnding: boolean = false,
  excludeWatched: boolean = false,
): UseChannelVideosReturn {
  // 세션 시드 (랜덤 정렬용)
  const sessionSeed = getSessionSeed();

  // 채널 ID가 없으면 전체 조회 (null)
  const channelIdsParam = selectedChannelIds.length > 0 ? selectedChannelIds : null;

  // 정렬 타입 결정 (all은 random으로 처리)
  const effectiveSortType = sortType === 'all' ? 'random' : sortType;

  const queryResult = useInfiniteQuery({
    queryKey: [
      'channelVideos',
      channelIdsParam,
      effectiveSortType,
      sessionSeed,
      includeEnding,
      excludeWatched,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      return contentApi.getChannelVideos(
        channelIdsParam,
        effectiveSortType,
        pageParam,
        PAGE_SIZE,
        sessionSeed,
        includeEnding,
        excludeWatched,
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    // 채널 선택 변경 시 이전 데이터 유지 (스크롤 리셋 방지)
    placeholderData: keepPreviousData,
  });

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    queryResult;

  // API 응답을 ChannelVideoModel로 변환 (중복 제거)
  const videos: ChannelVideoModel[] = (() => {
    const allVideos =
      data?.pages.flatMap((page) =>
        page.videos.map((v) => {
          const releaseYear = extractYear(v.releaseDate);
          const genreText = formatGenres(v.genreIds);
          return {
            videoId: v.videoId,
            contentId: v.contentId,
            contentType: v.contentType,
            videoTitle: v.videoTitle,
            channelId: v.channelId,
            channelName: v.channelName,
            channelLogoUrl: v.channelLogoUrl,
            contentTitle: v.contentTitle,
            // 옵셔널 필드: undefined가 아닐 때만 포함
            ...(v.backdropPath && { backdropPath: v.backdropPath }),
            ...(releaseYear && { releaseYear }),
            ...(genreText && { genreText }),
            ...(v.runtime && { runtime: v.runtime }),
          };
        }),
      ) ?? [];

    // videoId 기준 중복 제거
    const seen = new Set<string>();
    return allVideos.filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });
  })();

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    videos,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    totalCount,
    refetch,
  };
}
