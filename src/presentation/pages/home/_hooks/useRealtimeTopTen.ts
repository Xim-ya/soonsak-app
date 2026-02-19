import { useQuery } from '@tanstack/react-query';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import { contentApi } from '@/features/content/api/contentApi';
import { TopTenContentModel } from '../_types/topTenContentModel.home';

const TOP_TEN_LIMIT = 10;
const QUERY_KEY = 'realtimeTopTen';
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 실시간 Top 10 콘텐츠를 조회하는 훅
 *
 * 우선순위 로직:
 * 1. TMDB 주간 트렌딩 콘텐츠 중 빠른탐색에 등록된 콘텐츠 (1~N위)
 * 2. 빠른탐색 자체 인기 콘텐츠로 나머지 채움 (N+1~10위)
 */
export function useRealtimeTopTen() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<TopTenContentModel[]> => {
      // 1. TMDB 주간 트렌딩 콘텐츠 조회
      const trendingResponse = await tmdbApi.getTrendingWeekly();
      const trendingItems = trendingResponse.data.results;

      // 2. 트렌딩 콘텐츠 중 movie/tv만 필터링하고 ID 수집
      const movieIds = trendingItems
        .filter((item) => item.mediaType === 'movie')
        .map((item) => item.id);

      const tvIds = trendingItems.filter((item) => item.mediaType === 'tv').map((item) => item.id);

      // 3. Supabase에 등록된 콘텐츠 필터링 (movie, tv 각각)
      const [registeredMovies, registeredTvs] = await Promise.all([
        movieIds.length > 0
          ? contentApi.getRegisteredContentsByTmdbIds(movieIds, 'movie')
          : Promise.resolve([]),
        tvIds.length > 0
          ? contentApi.getRegisteredContentsByTmdbIds(tvIds, 'tv')
          : Promise.resolve([]),
      ]);

      // 4. 등록된 콘텐츠 ID Set 생성 (빠른 조회용)
      const registeredMovieIds = new Set(registeredMovies.map((c) => c.id));
      const registeredTvIds = new Set(registeredTvs.map((c) => c.id));

      // 5. TMDB 트렌딩 순서 유지하며 등록된 콘텐츠만 필터링
      const tmdbTopContents: TopTenContentModel[] = [];

      for (const item of trendingItems) {
        if (tmdbTopContents.length >= TOP_TEN_LIMIT) break;

        const isRegistered =
          (item.mediaType === 'movie' && registeredMovieIds.has(item.id)) ||
          (item.mediaType === 'tv' && registeredTvIds.has(item.id));

        if (isRegistered) {
          const rank = tmdbTopContents.length + 1;
          tmdbTopContents.push(TopTenContentModel.fromTrendingItem(item, rank));
        }
      }

      // 6. TMDB에서 10개를 다 채웠으면 반환
      if (tmdbTopContents.length >= TOP_TEN_LIMIT) {
        return tmdbTopContents;
      }

      // 7. 부족한 수만큼 인기도 기반 콘텐츠로 채움
      const remainingCount = TOP_TEN_LIMIT - tmdbTopContents.length;
      const engagementContents = await contentApi.getTopContentsByEngagement(
        remainingCount + tmdbTopContents.length,
      );

      // 8. TMDB에서 이미 포함된 콘텐츠 제외
      const tmdbContentKeys = new Set(tmdbTopContents.map((c) => `${c.id}-${c.type}`));

      const additionalContents: TopTenContentModel[] = [];

      for (const content of engagementContents) {
        if (additionalContents.length >= remainingCount) break;

        const contentKey = `${content.id}-${content.contentType}`;
        if (!tmdbContentKeys.has(contentKey)) {
          const rank = tmdbTopContents.length + additionalContents.length + 1;
          additionalContents.push(TopTenContentModel.fromContentDto(content, rank));
        }
      }

      return [...tmdbTopContents, ...additionalContents];
    },
    staleTime: STALE_TIME_MS,
  });
}
