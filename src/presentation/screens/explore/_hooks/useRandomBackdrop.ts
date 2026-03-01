/**
 * useRandomBackdrop - 랜덤 백드롭 이미지 훅
 *
 * 탐색 화면 헤더 배경으로 사용할 랜덤 콘텐츠의 백드롭 이미지를 가져옵니다.
 * 기존 탐색 콘텐츠 API를 활용하여 랜덤 콘텐츠 중 백드롭이 있는 것을 선택합니다.
 *
 * @example
 * const { backdropUrl, isLoading, error } = useRandomBackdrop();
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { TMDB_IMAGE_BASE_URL } from '@/features/tmdb/config';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';

// 상수
const FETCH_LIMIT = 10;
const STALE_TIME = 10 * 60 * 1000; // 10분
const GC_TIME = 30 * 60 * 1000; // 30분

// 기본 필터 (모든 콘텐츠)
const DEFAULT_FILTER: ContentFilter = {
  contentType: null,
  genreIds: [],
  countryCodes: [],
  releaseYearRange: null,
  minStarRating: null,
  includeEnding: false,
  channelIds: [],
  excludeWatched: false,
};

interface UseRandomBackdropReturn {
  backdropUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 백드롭 URL을 생성합니다.
 */
function buildBackdropUrl(backdropPath: string): string {
  return `${TMDB_IMAGE_BASE_URL}w1280${backdropPath}`;
}

/**
 * 랜덤 백드롭 이미지를 페칭합니다.
 */
async function fetchRandomBackdrop(sessionSeed: number): Promise<string | null> {
  const result = await contentApi.getExploreContents(
    'all',
    DEFAULT_FILTER,
    0,
    FETCH_LIMIT,
    sessionSeed,
  );

  // 백드롭이 있는 콘텐츠 필터링
  const contentsWithBackdrop = result.contents.filter((content) => content.backdropPath != null);

  if (contentsWithBackdrop.length === 0) {
    return null;
  }

  // 랜덤 선택
  const randomIndex = Math.floor(Math.random() * contentsWithBackdrop.length);
  const selectedContent = contentsWithBackdrop[randomIndex];

  // 타입 안전성 보장 (필터링 후에도 undefined 체크)
  if (selectedContent?.backdropPath == null) {
    return null;
  }

  return buildBackdropUrl(selectedContent.backdropPath);
}

export function useRandomBackdrop(): UseRandomBackdropReturn {
  // 세션별 랜덤 시드 (컴포넌트 생명주기 동안 유지)
  const sessionSeed = useMemo(() => Math.random(), []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['randomBackdrop', sessionSeed],
    queryFn: () => fetchRandomBackdrop(sessionSeed),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    backdropUrl: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
