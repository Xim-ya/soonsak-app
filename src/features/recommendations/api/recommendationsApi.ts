import { supabaseClient } from '@/shared/api/supabaseClient';
import { getAuthUser } from '@/shared/api/authUtils';
import { Logger } from '@/shared/utils/logger';

const RecommendationsLogger = Logger.create('Recommendations');
import type { ContentType } from '@/shared/types/content/contentType.enum';
import type { CurationVideoModel } from '@/features/content/types';
import type {
  GenrePreferenceDto,
  RecommendedContentDto,
  PersonalizedRecommendationsResponse,
} from '../types';

/**
 * RPC 함수명 상수
 */
const RPC_NAMES = {
  GET_GENRE_PREFERENCES: 'get_user_genre_preferences',
  GET_PERSONALIZED_RECOMMENDATIONS: 'get_personalized_recommendations',
  GET_PERSONALIZED_CURATION_VIDEOS: 'get_personalized_curation_videos',
} as const;

/**
 * RPC 응답 타입 정의
 */
interface GenrePreferenceRow {
  genre_id: number;
  preference_score: number;
  watch_count: number;
  completed_count: number;
  avg_rating: number;
  favorite_count: number;
}

interface RecommendationRow {
  content_row: {
    id: number;
    content_type: ContentType;
    title: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    vote_average?: number;
    popularity?: number;
    genre_ids?: number[];
    uploaded_at?: string;
    view_count?: number;
    play_count?: number;
  };
  recommendation_score: number;
  genre_match_score: number;
  channel_match_score: number;
  total_count: number;
}

interface CurationVideoRow {
  video_id: string;
  content_id: number;
  content_type: ContentType;
  video_title: string;
  content_title: string;
  thumbnail_url?: string;
  runtime?: number;
  channel_id?: string;
  channel_name?: string;
  channel_logo_url?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  genre_ids?: number[];
  recommendation_score: number;
}

/**
 * 개인화 추천 API
 */
export const recommendationsApi = {
  /**
   * 사용자 장르 선호도 조회
   * 시청 기록, 평점, 찜 데이터를 기반으로 장르별 선호도 점수 반환
   * @param limit 최대 반환 장르 수 (기본값: 10)
   */
  getGenrePreferences: async (limit: number = 10): Promise<GenrePreferenceDto[]> => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabaseClient.rpc(RPC_NAMES.GET_GENRE_PREFERENCES, {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (error) {
      RecommendationsLogger.error('장르 선호도 조회 실패:', error);
      throw new Error(`Failed to fetch genre preferences: ${error.message}`);
    }

    return ((data as GenrePreferenceRow[]) ?? []).map(
      (item): GenrePreferenceDto => ({
        genreId: item.genre_id,
        preferenceScore: item.preference_score,
        watchCount: item.watch_count,
        completedCount: item.completed_count,
        avgRating: item.avg_rating,
        favoriteCount: item.favorite_count,
      }),
    );
  },

  /**
   * 개인화 콘텐츠 추천 조회
   * 사용자 행동 데이터 기반 복합 점수로 추천 콘텐츠 반환
   * @param limit 페이지당 항목 수 (기본값: 20)
   * @param offset 오프셋 (기본값: 0)
   * @param contentType 콘텐츠 타입 필터 (선택)
   */
  getPersonalizedRecommendations: async (
    limit: number = 20,
    offset: number = 0,
    contentType?: ContentType,
  ): Promise<PersonalizedRecommendationsResponse> => {
    const user = await getAuthUser();
    if (!user) {
      return { contents: [], hasMore: false, totalCount: 0 };
    }

    const { data, error } = await supabaseClient.rpc(RPC_NAMES.GET_PERSONALIZED_RECOMMENDATIONS, {
      p_user_id: user.id,
      p_limit: limit,
      p_offset: offset,
      p_content_type: contentType ?? null,
    });

    if (error) {
      RecommendationsLogger.error('개인화 추천 조회 실패:', error);
      throw new Error(`Failed to fetch personalized recommendations: ${error.message}`);
    }

    const rows = (data as RecommendationRow[]) ?? [];
    if (rows.length === 0) {
      return { contents: [], hasMore: false, totalCount: 0 };
    }

    const totalCount = Number(rows[0]?.total_count ?? 0);
    const contents = rows.map(
      (item): RecommendedContentDto => ({
        id: item.content_row.id,
        contentType: item.content_row.content_type,
        title: item.content_row.title,
        posterPath: item.content_row.poster_path ?? '',
        backdropPath: item.content_row.backdrop_path ?? '',
        releaseDate: item.content_row.release_date ?? '',
        voteAverage: item.content_row.vote_average ?? 0,
        popularity: item.content_row.popularity ?? 0,
        genreIds: item.content_row.genre_ids ?? [],
        uploadedAt: item.content_row.uploaded_at ?? '',
        viewCount: item.content_row.view_count ?? 0,
        playCount: item.content_row.play_count ?? 0,
        recommendationScore: item.recommendation_score,
        genreMatchScore: item.genre_match_score,
        channelMatchScore: item.channel_match_score,
      }),
    );

    const hasMore = offset + limit < totalCount;

    return { contents, hasMore, totalCount };
  },

  /**
   * 개인화 큐레이션 비디오 조회
   * 추천 콘텐츠의 대표 비디오 + 채널 정보를 CurationVideoModel 형식으로 반환
   * @param limit 최대 반환 수 (기본값: 10)
   */
  getPersonalizedCurationVideos: async (limit: number = 10): Promise<CurationVideoModel[]> => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabaseClient.rpc(RPC_NAMES.GET_PERSONALIZED_CURATION_VIDEOS, {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (error) {
      RecommendationsLogger.error('개인화 큐레이션 비디오 조회 실패:', error);
      throw new Error(`Failed to fetch personalized curation videos: ${error.message}`);
    }

    return ((data as CurationVideoRow[]) ?? []).map(
      (item): CurationVideoModel => ({
        videoId: item.video_id,
        contentId: item.content_id,
        contentType: item.content_type,
        videoTitle: item.video_title,
        contentTitle: item.content_title,
        backdropPath: item.backdrop_path ?? '',
        // Optional 필드들은 조건부로 추가 (null/undefined만 제외, 0 등 유효값 유지)
        ...(item.thumbnail_url != null && { thumbnailUrl: item.thumbnail_url }),
        ...(item.runtime != null && { runtime: item.runtime }),
        ...(item.channel_id != null && { channelId: item.channel_id }),
        ...(item.channel_name != null && { channelName: item.channel_name }),
        ...(item.channel_logo_url != null && { channelLogoUrl: item.channel_logo_url }),
        ...(item.poster_path != null && { posterPath: item.poster_path }),
        ...(item.release_date != null && { releaseDate: item.release_date }),
        ...(item.genre_ids != null && { genreIds: item.genre_ids }),
      }),
    );
  },
};
