import { supabaseClient } from '@/shared/api/supabaseClient';
import { getAuthUser, requireAuth } from '@/shared/api/authUtils';
import { mapWithField } from '@/shared/utils/fieldMapper';
import { Logger } from '@/shared/utils/logger';

const ChannelFavoritesLogger = Logger.create('ChannelFavorites');
import type {
  ChannelFavoriteDto,
  ToggleChannelFavoriteParams,
  ChannelFavoriteStatusResponse,
} from '../types';

const TABLE_NAME = 'channel_favorites';

/**
 * 채널 찜하기 API
 */
export const channelFavoritesApi = {
  /**
   * 채널 찜 상태 조회
   * 특정 채널이 찜 목록에 있는지 확인
   */
  getChannelFavoriteStatus: async (channelId: string): Promise<ChannelFavoriteStatusResponse> => {
    const user = await getAuthUser();
    if (!user) {
      return { isFavorited: false, favoriteId: null };
    }

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .maybeSingle();

    if (error) {
      ChannelFavoritesLogger.error('채널 찜 상태 조회 실패:', error);
      return { isFavorited: false, favoriteId: null };
    }

    return {
      isFavorited: !!data,
      favoriteId: data?.id ?? null,
    };
  },

  /**
   * 채널 찜 추가
   * Duplicate key 에러(23505) 시 기존 데이터 반환 (race condition 대응)
   */
  addChannelFavorite: async (params: ToggleChannelFavoriteParams): Promise<ChannelFavoriteDto> => {
    const user = await requireAuth();

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        channel_id: params.channelId,
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
          .eq('channel_id', params.channelId)
          .single();

        // race condition으로 다른 요청이 삭제했을 수 있음
        if (existing.data) {
          return mapWithField<ChannelFavoriteDto>(existing.data);
        }
        // 데이터가 없으면 재시도 (삭제 후 다시 추가된 경우)
        throw new Error('채널 찜 상태가 변경되었습니다. 다시 시도해주세요.');
      }
      ChannelFavoritesLogger.error('채널 찜 추가 실패:', error);
      throw new Error(`Failed to add channel favorite: ${error.message}`);
    }

    return mapWithField<ChannelFavoriteDto>(data);
  },

  /**
   * 채널 찜 삭제
   */
  removeChannelFavorite: async (channelId: string): Promise<void> => {
    const user = await requireAuth();

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id)
      .eq('channel_id', channelId);

    if (error) {
      ChannelFavoritesLogger.error('채널 찜 삭제 실패:', error);
      throw new Error(`Failed to remove channel favorite: ${error.message}`);
    }
  },

  /**
   * 채널 찜 토글
   * 이미 찜한 경우 삭제, 아닌 경우 추가
   * addChannelFavorite에서 duplicate key를 처리하므로 race condition 안전
   * @returns 토글 후 상태
   */
  toggleChannelFavorite: async (
    params: ToggleChannelFavoriteParams,
  ): Promise<ChannelFavoriteStatusResponse> => {
    const status = await channelFavoritesApi.getChannelFavoriteStatus(params.channelId);

    if (status.isFavorited) {
      await channelFavoritesApi.removeChannelFavorite(params.channelId);
      return { isFavorited: false, favoriteId: null };
    } else {
      const favorite = await channelFavoritesApi.addChannelFavorite(params);
      return { isFavorited: true, favoriteId: favorite.id };
    }
  },

  /**
   * 찜한 채널 ID 목록 조회
   * 채널 목록에서 찜한 채널을 앞으로 정렬할 때 사용
   * @returns 찜한 채널 ID 배열
   */
  getFavoriteChannelIds: async (): Promise<string[]> => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('channel_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      ChannelFavoritesLogger.error('찜한 채널 ID 목록 조회 실패:', error);
      return [];
    }

    return data?.map((item) => item.channel_id) ?? [];
  },
};
