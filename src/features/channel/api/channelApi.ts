import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { mapWithField } from '@/features/utils/mapper/fieldMapper';
import { CHANNEL_DATABASE } from '@/features/utils/constants/dbConfig';
import { ChannelDto } from '../types';

export const channelApi = {
  /**
   * 활성화된 채널 목록 조회
   * Flutter: loadChannelSortedByContentCount() 참고
   * @param limit 조회할 채널 수 (기본값: 20)
   */
  getActiveChannels: async (
    limit: number = CHANNEL_DATABASE.LIMITS.MAX_CHANNELS,
  ): Promise<ChannelDto[]> => {
    const { data, error } = await supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .select('*')
      .eq(CHANNEL_DATABASE.COLUMNS.IS_ACTIVE, true)
      .order('subscriber_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('채널 목록 조회 실패:', error);
      throw new Error(`Failed to fetch channels: ${error.message}`);
    }

    return mapWithField<ChannelDto[]>(data ?? []);
  },

  /**
   * 활성화된 채널 목록 페이지네이션 조회
   * @param offset 시작 위치
   * @param limit 조회할 채널 수
   * @returns 채널 목록과 전체 개수
   */
  getActiveChannelsPaginated: async (
    offset: number,
    limit: number,
  ): Promise<{ channels: ChannelDto[]; totalCount: number; hasMore: boolean }> => {
    // 전체 개수 조회
    const { count } = await supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .select('*', { count: 'exact', head: true })
      .eq(CHANNEL_DATABASE.COLUMNS.IS_ACTIVE, true);

    const totalCount = count ?? 0;

    // 페이지 데이터 조회
    const { data, error } = await supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .select('*')
      .eq(CHANNEL_DATABASE.COLUMNS.IS_ACTIVE, true)
      .order('subscriber_count', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('채널 목록 페이지네이션 조회 실패:', error);
      throw new Error(`Failed to fetch channels: ${error.message}`);
    }

    const channels = mapWithField<ChannelDto[]>(data ?? []);
    const hasMore = offset + channels.length < totalCount;

    return { channels, totalCount, hasMore };
  },

  /**
   * 랜덤 활성화된 채널 목록 조회 (RPC)
   * @param limit 조회할 채널 수 (기본값: 12)
   */
  getRandomActiveChannels: async (
    limit: number = CHANNEL_DATABASE.LIMITS.DEFAULT_RANDOM,
  ): Promise<ChannelDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CHANNEL_DATABASE.RPC.GET_RANDOM_ACTIVE_CHANNELS,
      { row_limit: limit },
    );

    if (error) {
      console.error('랜덤 채널 목록 조회 실패:', error);
      throw new Error(`Failed to fetch random channels: ${error.message}`);
    }

    return mapWithField<ChannelDto[]>(data ?? []);
  },
};
