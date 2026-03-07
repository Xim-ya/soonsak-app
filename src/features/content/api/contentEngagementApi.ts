import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import { ContentDto } from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import { ContentType } from '@/core/types/content/contentType.enum';
import { shouldThrottleRpc } from './contentApiUtils';

export const contentEngagementApi = {
  /**
   * 콘텐츠 조회수 증가 (상세 페이지 진입 시)
   * 동일 콘텐츠에 대해 5초 이내 중복 호출 방지
   */
  incrementViewCount: async (contentId: number, contentType: ContentType): Promise<void> => {
    if (shouldThrottleRpc(`view:${contentId}:${contentType}`)) return;

    const { error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.INCREMENT_VIEW_COUNT, {
      p_content_id: contentId,
      p_content_type: contentType,
    });

    if (error) {
      ContentLogger.error('조회수 증가 실패:', error);
      // 조회수 증가 실패는 사용자 경험에 영향을 주지 않으므로 throw하지 않음
    }
  },

  /**
   * 콘텐츠 재생수 증가 (영상 재생 시)
   * 동일 콘텐츠에 대해 5초 이내 중복 호출 방지
   */
  incrementPlayCount: async (contentId: number, contentType: ContentType): Promise<void> => {
    if (shouldThrottleRpc(`play:${contentId}:${contentType}`)) return;

    const { error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.INCREMENT_PLAY_COUNT, {
      p_content_id: contentId,
      p_content_type: contentType,
    });

    if (error) {
      ContentLogger.error('재생수 증가 실패:', error);
      // 재생수 증가 실패는 사용자 경험에 영향을 주지 않으므로 throw하지 않음
    }
  },

  /**
   * 실시간 Top 콘텐츠 조회 (점수 기반)
   * 가중치: play_count x 2 + view_count x 1
   * @param limit 조회할 콘텐츠 수
   * @returns ContentDto 배열
   */
  getTopContentsByEngagement: async (limit: number = 20): Promise<ContentDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_TOP_CONTENTS_BY_SCORE,
      {
        p_limit: limit,
      },
    );

    if (error) {
      ContentLogger.error('인기 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch top contents: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },
};
