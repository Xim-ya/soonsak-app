/**
 * 개인화 추천 React Query Hooks
 */

import { useQuery, useInfiniteQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import type { ContentType } from '@/core/types/content/contentType.enum';
import type { CurationVideoModel } from '@/features/content/types';
import { recommendationsApi } from '../api/recommendationsApi';
import { GenrePreferenceModel, RecommendedContentModel } from '../types/recommendationModel';
import type { PersonalizedRecommendationsResponse } from '../types';

/** 캐시 시간 상수 */
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Query Key 팩토리
 * - userId를 포함하여 로그인 상태 변경 시 자동으로 새 캐시 사용
 * - limit을 포함하여 다른 limit 값에 대해 별도 캐시 사용
 */
export const recommendationKeys = {
  all: (userId: string | null) => ['recommendations', userId] as const,
  genrePreferences: (userId: string | null, limit: number) =>
    [...recommendationKeys.all(userId), 'genrePreferences', limit] as const,
  personalized: (userId: string | null, contentType?: string, pageSize?: number) =>
    [
      ...recommendationKeys.all(userId),
      'personalized',
      contentType ?? 'all',
      pageSize ?? 20,
    ] as const,
  curationVideos: (userId: string | null, limit: number) =>
    [...recommendationKeys.all(userId), 'curationVideos', limit] as const,
};

/**
 * 사용자 장르 선호도 조회 Hook
 * 캐시: 30분 (선호도는 자주 변하지 않음)
 */
export const useGenrePreferences = (
  limit: number = 10,
  options?: { enabled?: boolean },
): UseQueryResult<GenrePreferenceModel[], Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: recommendationKeys.genrePreferences(userId, limit),
    queryFn: () => recommendationsApi.getGenrePreferences(limit),
    select: GenrePreferenceModel.fromDtoList,
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: [],
    staleTime: THIRTY_MINUTES,
    gcTime: ONE_HOUR,
  });
};

/**
 * 개인화 추천 콘텐츠 조회 Hook (무한 스크롤)
 * 캐시: 10분 (추천은 적당히 갱신)
 */
export const usePersonalizedRecommendations = (
  contentType?: ContentType,
  pageSize: number = 20,
  options?: { enabled?: boolean },
) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: recommendationKeys.personalized(userId, contentType, pageSize),
    queryFn: ({ pageParam = 0 }) =>
      recommendationsApi.getPersonalizedRecommendations(
        pageSize,
        pageParam * pageSize,
        contentType,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
    select: (data) => ({
      pages: data.pages.map((page) => ({
        ...page,
        contents: RecommendedContentModel.fromDtoList(page.contents),
      })),
      pageParams: data.pageParams,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 개인화 추천 콘텐츠 조회 Hook (단일 페이지)
 * 홈 화면 등 일부 추천만 필요한 경우 사용
 */
export const usePersonalizedRecommendationsPage = (
  limit: number = 10,
  contentType?: ContentType,
  options?: { enabled?: boolean },
): UseQueryResult<
  {
    contents: RecommendedContentModel[];
    hasMore: boolean;
    totalCount: number;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...recommendationKeys.personalized(userId, contentType), 'page', limit],
    queryFn: () => recommendationsApi.getPersonalizedRecommendations(limit, 0, contentType),
    select: (data: PersonalizedRecommendationsResponse) => ({
      contents: RecommendedContentModel.fromDtoList(data.contents),
      hasMore: data.hasMore,
      totalCount: data.totalCount,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { contents: [], hasMore: false, totalCount: 0 },
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 개인화 큐레이션 비디오 조회 Hook
 * 탐색 화면 상단 캐러셀용 - 추천 콘텐츠의 대표 비디오 반환
 * 캐시: 10분
 */
export const usePersonalizedCurationVideos = (
  limit: number = 10,
  options?: { enabled?: boolean },
): UseQueryResult<CurationVideoModel[], Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: recommendationKeys.curationVideos(userId, limit),
    queryFn: () => recommendationsApi.getPersonalizedCurationVideos(limit),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: [],
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};
