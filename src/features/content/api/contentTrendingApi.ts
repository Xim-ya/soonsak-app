import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import { ContentDto } from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import { mapTrendingRowsToContentDtos } from './contentApiUtils';

export const contentTrendingApi = {
  /**
   * 이번주 뜨는 콘텐츠 조회 (복합 점수 기반)
   * 가중치: 시청완료(100) > 찜(80) > TMDB평점(60) > 앱내평점(60) > YT조회수(35) > YT좋아요비율(30) > TMDB인기도(10)
   * @param limit 조회할 콘텐츠 수 (기본값: 15)
   * @returns 트렌딩 콘텐츠 배열
   */
  getTrendingContents: async (limit: number = 15): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_TRENDING_CONTENTS, {
      p_limit: limit,
    });

    if (error) {
      ContentLogger.error('트렌딩 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch trending contents: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 순삭 TOP 10 조회 (홈 화면용)
   * 조건: 대표 비디오가 결말 포함(includes_ending=true)인 콘텐츠만
   * 가중치: YT좋아요비율(100) > YT조회수(80) > 시청완료(60) > 찜(50) > TMDB평점(40) > 앱내평점(40) > TMDB인기도(10)
   * @param limit 조회할 콘텐츠 수 (기본값: 10)
   * @returns 트렌딩 콘텐츠 배열
   */
  getSoonsakTopTen: async (limit: number = 10): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_SOONSAK_TOP_TEN, {
      p_limit: limit,
    });

    if (error) {
      ContentLogger.error('순삭 TOP 10 조회 실패:', error);
      throw new Error(`Failed to fetch soonsak top ten: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 최근 업로드된 콘텐츠 중 트렌딩 조회 (검색 화면용)
   * 최근 2주 내 업로드된 콘텐츠만 대상으로 복합 점수 계산
   * @param limit 조회할 콘텐츠 수 (기본값: 15)
   * @param days 업로드 기준 일수 (기본값: 14)
   * @returns 트렌딩 콘텐츠 배열
   */
  getRecentTrendingContents: async (
    limit: number = 15,
    days: number = 14,
  ): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RECENT_TRENDING_CONTENTS,
      {
        p_limit: limit,
        p_days: days,
      },
    );

    if (error) {
      ContentLogger.error('최근 트렌딩 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch recent trending contents: ${error.message}`);
    }

    return mapTrendingRowsToContentDtos(data ?? []);
  },

  /**
   * 홈 배너용 랜덤 콘텐츠 조회
   * 조건: backdrop_path/tagline 필수, 대표영상 결말포함, 평점 6.0+, 좋아요비율 0.4%+
   * 정렬: 조회수 가중치 랜덤 (조회수 높을수록 선택 확률 증가)
   * @param limit 조회할 콘텐츠 수 (기본값: 5, 최대: 20)
   * @returns ContentDto 배열 (빈 배열 가능)
   */
  getRandomBannerContents: async (limit: number = 5): Promise<ContentDto[]> => {
    // 유효한 limit 값으로 정규화 (1~20 범위)
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);

    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RANDOM_BANNER_CONTENTS,
      { p_limit: safeLimit },
    );

    if (error) {
      ContentLogger.error('배너 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch banner contents: ${error.message}`);
    }

    // 빈 결과 처리: RPC가 null 또는 빈 배열 반환 시 빈 배열 반환
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return mapWithField<ContentDto[]>(data);
  },
};
