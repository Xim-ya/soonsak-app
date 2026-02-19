/**
 * Admin Content API
 *
 * 어드민 전용 콘텐츠 관련 API
 */

import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { CONTENT_DATABASE } from '@/features/utils/constants/dbConfig';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { ContentStatus } from '@/features/content/types';

export const adminContentApi = {
  /**
   * 콘텐츠 backdrop_path 업데이트
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param backdropPath TMDB backdrop 경로 (예: /abc123.jpg)
   */
  updateBackdropPath: async (
    contentId: number,
    contentType: ContentType,
    backdropPath: string,
  ): Promise<void> => {
    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .update({ backdrop_path: backdropPath })
      .eq('id', contentId)
      .eq('content_type', contentType);

    if (error) {
      console.error('Backdrop 업데이트 실패:', error);
      throw new Error(`Failed to update backdrop path: ${error.message}`);
    }
  },

  /**
   * 비디오 상태 업데이트
   * rejected로 변경 시:
   * - is_primary = false 함께 설정 (앱에서 처리)
   * - DB 트리거가 자동으로: 유일한 비디오면 콘텐츠 삭제, 아니면 다음 비디오를 primary로 승격
   *
   * @param videoId 비디오 ID
   * @param status 새 상태
   */
  updateVideoStatus: async (videoId: string, status: ContentStatus): Promise<void> => {
    // rejected로 변경 시 is_primary도 false로 설정
    const updateData =
      status === 'rejected' ? { status, is_primary: false } : { status };

    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update(updateData)
      .eq('id', videoId);

    if (error) {
      console.error('비디오 상태 업데이트 실패:', error);
      throw new Error(`Failed to update video status: ${error.message}`);
    }
  },

  /**
   * 콘텐츠 상태 업데이트
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param status 새 상태
   */
  updateContentStatus: async (
    contentId: number,
    contentType: ContentType,
    status: ContentStatus,
  ): Promise<void> => {
    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .update({ status })
      .eq('id', contentId)
      .eq('content_type', contentType);

    if (error) {
      console.error('콘텐츠 상태 업데이트 실패:', error);
      throw new Error(`Failed to update content status: ${error.message}`);
    }
  },
};
