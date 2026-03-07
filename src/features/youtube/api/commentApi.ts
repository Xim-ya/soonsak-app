/**
 * YouTube 댓글 API
 * Supabase Edge Function을 통해 댓글을 조회
 *
 * 2단계 최적화 흐름:
 * 1. prefetchToken: 페이지 진입 시 continuation token만 미리 조회
 * 2. getCommentsWithToken: 댓글 탭 진입 시 토큰으로 댓글 조회
 */

import { CommentsResponseDto } from '../types';
import { CommentLogger } from '@/core/utils';

/** Edge Function URL */
const EDGE_FUNCTION_URL = 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/youtube-comments';

/** Prefetch 응답 타입 */
export interface CommentTokenResponseDto {
  readonly token: string | null;
  readonly totalCountText: string | undefined;
}

export const commentApi = {
  /**
   * 1단계: Continuation token만 미리 조회 (prefetch용)
   * @param videoId YouTube 비디오 ID
   */
  async prefetchToken(videoId: string): Promise<CommentTokenResponseDto> {
    CommentLogger.log('🔑 댓글 토큰 prefetch 시작:', videoId);

    try {
      const response = await fetch(
        `${EDGE_FUNCTION_URL}?videoId=${encodeURIComponent(videoId)}&mode=token`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      CommentLogger.log('✅ 댓글 토큰 prefetch 완료:', !!data.token);

      return {
        token: data.token || null,
        totalCountText: data.totalCountText,
      };
    } catch (error) {
      CommentLogger.error('❌ 댓글 토큰 prefetch 실패:', error);
      throw error;
    }
  },

  /**
   * 2단계: Token으로 댓글 조회
   * @param token Continuation token
   * @param totalCountText 미리 조회한 댓글 수 텍스트
   */
  async getCommentsWithToken(token: string, totalCountText?: string): Promise<CommentsResponseDto> {
    CommentLogger.log('💬 댓글 조회 시작 (토큰 사용)');

    try {
      const response = await fetch(
        `${EDGE_FUNCTION_URL}?token=${encodeURIComponent(token)}&mode=comments`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      CommentLogger.log(`✅ 댓글 ${data.comments?.length || 0}개 조회 완료`);

      return {
        comments: data.comments || [],
        totalCountText,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      CommentLogger.error('❌ 댓글 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 전체 흐름 (기존 호환성 유지)
   * @param videoId YouTube 비디오 ID
   * @param sortBy 정렬 기준 ('TOP' | 'NEWEST')
   */
  async getComments(
    videoId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sortBy: 'TOP' | 'NEWEST' = 'TOP',
  ): Promise<CommentsResponseDto> {
    CommentLogger.log('💬 댓글 조회 시작:', videoId);

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}?videoId=${encodeURIComponent(videoId)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      CommentLogger.log(`✅ 댓글 ${data.comments?.length || 0}개 조회 완료`);

      return {
        comments: data.comments || [],
        totalCountText: data.totalCountText,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      CommentLogger.error('❌ 댓글 조회 실패:', error);
      throw error;
    }
  },
};
