import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { TopTenContentModel } from '../_types/topTenContentModel.home';

const TOP_TEN_LIMIT = 10;
const RECENT_DAYS = 7;
const QUERY_KEY = 'weeklyTopTen';
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 이번주 인기작 Top 10 콘텐츠를 조회하는 훅
 *
 * 조건: 최근 1주 내 업로드된 콘텐츠 대상
 * 가중치: 시청완료(100) > 찜(90) > 앱내평점(80) > TMDB평점(40) > YT좋아요비율(20) > YT조회수(15) > TMDB인기도(10)
 */
export function useRealtimeTopTen() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<TopTenContentModel[]> => {
      const trendingContents = await contentApi.getRecentTrendingContents(
        TOP_TEN_LIMIT,
        RECENT_DAYS,
      );

      if (!trendingContents || trendingContents.length === 0) {
        return [];
      }

      return trendingContents.map((content, index) =>
        TopTenContentModel.fromContentDto(content, index + 1),
      );
    },
    staleTime: STALE_TIME_MS,
  });
}
