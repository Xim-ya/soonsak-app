import { supabaseClient, getAuthUser, requireAuth } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { Logger } from '@/core/utils';

const RatingsLogger = Logger.create('Ratings');
import type {
  RatingDto,
  SetRatingParams,
  RatingStatusResponse,
  RatingWithContentDto,
} from '../types';

const TABLE_NAME = 'content_ratings';

/**
 * 평점 API
 */
export const ratingsApi = {
  /**
   * 평점 상태 조회
   * 특정 콘텐츠에 대한 내 평점 조회
   */
  getRatingStatus: async (
    contentId: number,
    contentType: string,
  ): Promise<RatingStatusResponse> => {
    const user = await getAuthUser();
    if (!user) {
      return { hasRating: false, rating: null, ratingId: null };
    }

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('id, rating')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();

    if (error) {
      RatingsLogger.error('평점 상태 조회 실패:', error);
      return { hasRating: false, rating: null, ratingId: null };
    }

    if (!data || data.rating === 0) {
      return { hasRating: false, rating: null, ratingId: data?.id ?? null };
    }

    return {
      hasRating: true,
      rating: data.rating,
      ratingId: data.id,
    };
  },

  /**
   * 평점 등록/수정
   * - rating이 0.0이면 평점 취소 (삭제)
   * - 기존 평점이 있으면 수정, 없으면 등록
   */
  setRating: async (params: SetRatingParams): Promise<RatingStatusResponse> => {
    const user = await requireAuth();

    // rating이 0이면 삭제
    if (params.rating === 0) {
      await supabaseClient
        .from(TABLE_NAME)
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', params.contentId)
        .eq('content_type', params.contentType);

      return { hasRating: false, rating: null, ratingId: null };
    }

    // upsert로 등록 또는 수정
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: user.id,
          content_id: params.contentId,
          content_type: params.contentType,
          rating: params.rating,
        },
        {
          onConflict: 'user_id,content_id,content_type',
        },
      )
      .select()
      .single();

    if (error) {
      RatingsLogger.error('평점 등록/수정 실패:', error);
      throw new Error(`Failed to set rating: ${error.message}`);
    }

    const mapped = mapWithField<RatingDto>(data);
    return {
      hasRating: true,
      rating: mapped.rating,
      ratingId: mapped.id,
    };
  },

  /**
   * 평점 삭제
   */
  removeRating: async (contentId: number, contentType: string): Promise<void> => {
    const user = await requireAuth();

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (error) {
      RatingsLogger.error('평점 삭제 실패:', error);
      throw new Error(`Failed to remove rating: ${error.message}`);
    }
  },

  /**
   * 내 평점 개수 조회
   */
  getRatingsCount: async (): Promise<number> => {
    const user = await getAuthUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('rating', 0);

    if (error) {
      RatingsLogger.error('평점 개수 조회 실패:', error);
      return 0;
    }

    return count ?? 0;
  },

  /**
   * 평점 목록 조회 (최신순)
   * 콘텐츠 정보 포함
   */
  getRatingsList: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: RatingWithContentDto[];
    hasMore: boolean;
    totalCount: number;
  }> => {
    const user = await requireAuth();

    // 전체 카운트 조회
    const { count, error: countError } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('rating', 0);

    if (countError) {
      RatingsLogger.error('평점 목록 수 조회 실패:', countError);
      throw new Error(`Failed to count ratings: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { items: [], hasMore: false, totalCount: 0 };
    }

    // 데이터 조회
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        contents!content_ratings_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .gt('rating', 0)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      RatingsLogger.error('평점 목록 조회 실패:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    type ContentJoin = { title?: string; poster_path?: string; backdrop_path?: string } | null;

    const items: RatingWithContentDto[] = (data ?? []).map((item) => {
      const contents = item.contents as ContentJoin;
      return {
        ...mapWithField<RatingDto>(item),
        contentTitle: contents?.title ?? '',
        contentPosterPath: contents?.poster_path ?? '',
        contentBackdropPath: contents?.backdrop_path ?? '',
      };
    });

    const hasMore = offset + limit < totalCount;

    return { items, hasMore, totalCount };
  },
};
