import { useQuery } from '@tanstack/react-query';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import { contentApi } from '@/features/content/api/contentApi';
import { RelatedContentModel } from '../_types/relatedContentModel.cd';

/** 캐시 유지 시간 (5분) */
const STALE_TIME_MS = 1000 * 60 * 5;

/** 관련 콘텐츠 최대 개수 (3열 × 6행) */
const MAX_RELATED_CONTENTS = 18;

/**
 * TMDB에서 추천 콘텐츠 ID 목록을 조회
 */
async function fetchTmdbRecommendationIds(
  contentId: number,
  contentType: 'movie' | 'tv',
): Promise<number[]> {
  const response =
    contentType === 'movie'
      ? await tmdbApi.getMovieRecommendations(contentId)
      : await tmdbApi.getTvRecommendations(contentId);

  return response.data.results.map((item) => item.id);
}

interface UseEnhancedRelatedContentsParams {
  contentId: number;
  contentType: ContentType;
  genreIds: number[];
}

/**
 * useEnhancedRelatedContents - TMDB 추천 + 장르 기반으로 관련 콘텐츠를 조회하는 훅
 *
 * 1. TMDB API에서 추천 콘텐츠를 조회하고 Supabase에 등록된 콘텐츠만 필터링
 * 2. TMDB 순서를 유지하여 정렬
 * 3. 18개 미만이면 장르 기반으로 추가 콘텐츠 조회 (현재 콘텐츠 + TMDB 결과 제외)
 * 4. 최대 18개까지 병합하여 반환
 *
 * @param params.contentId - 콘텐츠 고유 ID
 * @param params.contentType - 콘텐츠 타입 ('movie' | 'tv')
 * @param params.genreIds - 현재 콘텐츠의 장르 ID 배열
 * @returns 관련 콘텐츠 목록, 로딩 상태, 에러 상태
 *
 * @example
 * const { data, isLoading, error } = useEnhancedRelatedContents({
 *   contentId: 550,
 *   contentType: 'movie',
 *   genreIds: [28, 12, 878],
 * });
 */
export function useEnhancedRelatedContents({
  contentId,
  contentType,
  genreIds,
}: UseEnhancedRelatedContentsParams): {
  data: RelatedContentModel[];
  isLoading: boolean;
  error: Error | null;
} {
  const isSupported = contentType === 'movie' || contentType === 'tv';
  const hasGenres = genreIds.length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['enhancedRelatedContents', contentId, contentType, genreIds],
    queryFn: async (): Promise<RelatedContentModel[]> => {
      if (contentType !== 'movie' && contentType !== 'tv') {
        return [];
      }

      // 1. TMDB에서 추천 콘텐츠 ID 조회 (중복 제거)
      const tmdbIds = [...new Set(await fetchTmdbRecommendationIds(contentId, contentType))];

      // 2. Supabase에서 등록된 콘텐츠만 필터링
      let tmdbContents: RelatedContentModel[] = [];
      if (tmdbIds.length > 0) {
        const tmdbContentDtos = await contentApi.getRegisteredContentsByTmdbIds(
          tmdbIds,
          contentType,
        );

        // TMDB 순서 유지하여 정렬
        const contentMap = new Map(tmdbContentDtos.map((dto) => [dto.id, dto]));
        const sortedTmdbDtos = tmdbIds.map((id) => contentMap.get(id)).filter(Boolean);

        // TMDB 추천 콘텐츠는 isRecommended: true
        tmdbContents = RelatedContentModel.fromDtoList(
          sortedTmdbDtos as NonNullable<(typeof sortedTmdbDtos)[number]>[],
          true,
        );
      }

      // 3. 18개 미만이면 장르 기반으로 추가 조회
      if (tmdbContents.length < MAX_RELATED_CONTENTS && genreIds.length > 0) {
        const neededCount = MAX_RELATED_CONTENTS - tmdbContents.length;
        const excludeIds = [contentId, ...tmdbContents.map((c) => c.id)];

        const genreContentDtos = await contentApi.getContentsByGenre(
          genreIds,
          contentType,
          excludeIds,
          neededCount,
        );

        // 장르 기반 콘텐츠는 isRecommended: false
        const genreContents = RelatedContentModel.fromDtoList(genreContentDtos, false);
        tmdbContents = [...tmdbContents, ...genreContents];
      }

      // 4. 최종 중복 제거 (id 기준)
      const uniqueContents = Array.from(new Map(tmdbContents.map((c) => [c.id, c])).values());

      return uniqueContents.slice(0, MAX_RELATED_CONTENTS);
    },
    enabled: isSupported && hasGenres,
    retry: false,
    staleTime: STALE_TIME_MS,
  });

  return {
    data: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
