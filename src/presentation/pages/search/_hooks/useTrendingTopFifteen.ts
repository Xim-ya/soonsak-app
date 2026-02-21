import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { TrendingContentModel } from '../_types/trendingContentModel';

const TOP_FIFTEEN_LIMIT = 15;
const RECENT_DAYS = 21;
const QUERY_KEY = 'recentTrendingContents';
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 검색 화면용 최근 3주 내 업로드된 Top 15 콘텐츠를 조회하는 훅
 *
 * 복합 점수 기반 랭킹 (사용자 행동 데이터 가중치 높음):
 * - 시청완료(100) > 찜(90) > 앱내평점(80) > TMDB평점(40) > YT좋아요비율(20) > YT조회수(15) > TMDB인기도(10)
 */
export function useTrendingTopFifteen() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<TrendingContentModel[]> => {
      const trendingContents = await contentApi.getRecentTrendingContents(
        TOP_FIFTEEN_LIMIT,
        RECENT_DAYS,
      );

      if (!trendingContents || trendingContents.length === 0) {
        return [];
      }

      return trendingContents.map((content, index) =>
        TrendingContentModel.fromContentDto(content, index + 1),
      );
    },
    staleTime: STALE_TIME_MS,
  });
}
