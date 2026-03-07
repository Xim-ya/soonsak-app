import { supabaseClient, getAuthUser, requireAuth } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { Logger } from '@/core/utils';

const FavoritesLogger = Logger.create('Favorites');
import type {
  FavoriteDto,
  FavoriteWithContentDto,
  ToggleFavoriteParams,
  FavoriteStatusResponse,
} from '../types';

const TABLE_NAME = 'favorites';

/**
 * 찜하기 API
 */
export const favoritesApi = {
  /**
   * 찜 개수 조회
   */
  getFavoritesCount: async (): Promise<number> => {
    const user = await getAuthUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      FavoritesLogger.error('찜 개수 조회 실패:', error);
      return 0;
    }

    return count ?? 0;
  },

  /**
   * 찜 상태 조회
   * 특정 콘텐츠가 찜 목록에 있는지 확인
   */
  getFavoriteStatus: async (
    contentId: number,
    contentType: string,
  ): Promise<FavoriteStatusResponse> => {
    const user = await getAuthUser();
    if (!user) {
      return { isFavorited: false, favoriteId: null };
    }

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();

    if (error) {
      FavoritesLogger.error('찜 상태 조회 실패:', error);
      return { isFavorited: false, favoriteId: null };
    }

    return {
      isFavorited: !!data,
      favoriteId: data?.id ?? null,
    };
  },

  /**
   * 찜 추가
   * Duplicate key 에러(23505) 시 기존 데이터 반환 (race condition 대응)
   */
  addFavorite: async (params: ToggleFavoriteParams): Promise<FavoriteDto> => {
    const user = await requireAuth();

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        content_id: params.contentId,
        content_type: params.contentType,
      })
      .select()
      .single();

    if (error) {
      // Duplicate key 에러 = 이미 존재함 (race condition으로 다른 요청이 먼저 추가)
      if (error.code === '23505') {
        const existing = await supabaseClient
          .from(TABLE_NAME)
          .select()
          .eq('user_id', user.id)
          .eq('content_id', params.contentId)
          .eq('content_type', params.contentType)
          .single();

        if (existing.data) {
          return mapWithField<FavoriteDto>(existing.data);
        }
      }
      FavoritesLogger.error('찜 추가 실패:', error);
      throw new Error(`Failed to add favorite: ${error.message}`);
    }

    return mapWithField<FavoriteDto>(data);
  },

  /**
   * 찜 삭제
   */
  removeFavorite: async (contentId: number, contentType: string): Promise<void> => {
    const user = await requireAuth();

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (error) {
      FavoritesLogger.error('찜 삭제 실패:', error);
      throw new Error(`Failed to remove favorite: ${error.message}`);
    }
  },

  /**
   * 찜 토글
   * 이미 찜한 경우 삭제, 아닌 경우 추가
   * addFavorite에서 duplicate key를 처리하므로 race condition 안전
   * @returns 토글 후 상태
   */
  toggleFavorite: async (params: ToggleFavoriteParams): Promise<FavoriteStatusResponse> => {
    const status = await favoritesApi.getFavoriteStatus(params.contentId, params.contentType);

    if (status.isFavorited) {
      await favoritesApi.removeFavorite(params.contentId, params.contentType);
      return { isFavorited: false, favoriteId: null };
    } else {
      const favorite = await favoritesApi.addFavorite(params);
      return { isFavorited: true, favoriteId: favorite.id };
    }
  },

  /**
   * 찜 목록 조회 (최신순)
   * 콘텐츠 정보 포함
   */
  getFavoritesList: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    items: FavoriteWithContentDto[];
    hasMore: boolean;
    totalCount: number;
  }> => {
    const user = await requireAuth();

    // 전체 카운트 조회
    const { count, error: countError } = await supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      FavoritesLogger.error('찜 목록 수 조회 실패:', countError);
      throw new Error(`Failed to count favorites: ${countError.message}`);
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
        contents!favorites_content_fkey (
          title,
          poster_path,
          backdrop_path
        )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      FavoritesLogger.error('찜 목록 조회 실패:', error);
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    type ContentJoin = { title?: string; poster_path?: string; backdrop_path?: string } | null;

    const items: FavoriteWithContentDto[] = (data ?? []).map((item) => {
      const contents = item.contents as ContentJoin;
      return {
        ...mapWithField<FavoriteDto>(item),
        contentTitle: contents?.title ?? '',
        contentPosterPath: contents?.poster_path ?? '',
        contentBackdropPath: contents?.backdrop_path ?? '',
      };
    });

    const hasMore = offset + limit < totalCount;

    return { items, hasMore, totalCount };
  },
};
