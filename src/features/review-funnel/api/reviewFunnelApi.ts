import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { mapWithField } from '@/shared/utils/fieldMapper';
import { Logger } from '@/shared/utils/logger';

const ReviewFunnelLogger = Logger.create('ReviewFunnel');
import type {
  ReviewFunnelSessionDto,
  CreateFunnelSessionParams,
  ReviewType,
  RecommendedContent,
} from '../types';

const TABLE_NAME = 'review_funnel_sessions';

/**
 * 인증된 사용자 정보 반환
 * @throws 미인증 시 에러
 */
async function requireAuth(): Promise<User> {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data.user) {
    throw new Error('User not authenticated');
  }
  return data.user;
}

/**
 * 리뷰 퍼널 API
 */
export const reviewFunnelApi = {
  /**
   * 퍼널 세션 조회 또는 생성 (유저당 1개만 존재)
   * 이미 세션이 있으면 반환, 없으면 새로 생성
   */
  getOrCreateSession: async (
    params: CreateFunnelSessionParams,
  ): Promise<ReviewFunnelSessionDto> => {
    const user = await requireAuth();

    // 1. 기존 세션 조회
    const { data: existing } = await supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return mapWithField<ReviewFunnelSessionDto>(existing);
    }

    // 2. 없으면 새로 생성
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        notification_id: params.notificationId ?? null,
        platform: params.platform ?? null,
        app_version: params.appVersion ?? null,
        has_reviewed: null,
      })
      .select()
      .single();

    if (error) {
      ReviewFunnelLogger.error('퍼널 세션 생성 실패:', error);
      throw new Error(`Failed to create funnel session: ${error.message}`);
    }

    return mapWithField<ReviewFunnelSessionDto>(data);
  },

  /**
   * 퍼널 진입 처리 (null → false)
   * 이미 true인 경우 변경하지 않음
   */
  markAsEntered: async (sessionId: string): Promise<void> => {
    const user = await requireAuth();

    // has_reviewed가 null인 경우에만 false로 변경
    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .update({ has_reviewed: false })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .is('has_reviewed', null);

    if (error) {
      ReviewFunnelLogger.error('퍼널 진입 처리 실패:', error);
    }
  },

  /**
   * 리뷰 완료 처리 (false → true)
   * 이미 true인 경우 변경하지 않음
   * @param reviewType - 'rating_only': 평점만, 'write_review': 리뷰 내용도
   */
  markAsReviewed: async (sessionId: string, reviewType: ReviewType): Promise<void> => {
    const user = await requireAuth();

    // has_reviewed가 false인 경우에만 true로 변경
    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .update({
        has_reviewed: true,
        review_type: reviewType,
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('has_reviewed', false);

    if (error) {
      ReviewFunnelLogger.error('리뷰 완료 처리 실패:', error);
    }
  },

  /**
   * 세션 ID로 퍼널 세션 조회
   */
  getSession: async (sessionId: string): Promise<ReviewFunnelSessionDto | null> => {
    const user = await requireAuth();

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      ReviewFunnelLogger.error('퍼널 세션 조회 실패:', error);
      return null;
    }

    return data ? mapWithField<ReviewFunnelSessionDto>(data) : null;
  },

  /**
   * 퍼널 통계 조회 (관리자용)
   */
  getFunnelStats: async (
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalSessions: number;
    notOpenedCount: number;
    droppedCount: number;
    reviewedCount: number;
    conversionRate: number;
  }> => {
    let query = supabaseClient.from(TABLE_NAME).select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      ReviewFunnelLogger.error('퍼널 통계 조회 실패:', error);
      throw new Error(`Failed to fetch funnel stats: ${error.message}`);
    }

    const sessions = data ?? [];
    const totalSessions = sessions.length;
    const notOpenedCount = sessions.filter((s) => s.has_reviewed === null).length;
    const droppedCount = sessions.filter((s) => s.has_reviewed === false).length;
    const reviewedCount = sessions.filter((s) => s.has_reviewed === true).length;

    const conversionRate = totalSessions > 0 ? (reviewedCount / totalSessions) * 100 : 0;

    return {
      totalSessions,
      notOpenedCount,
      droppedCount,
      reviewedCount,
      conversionRate,
    };
  },

  /**
   * 유저의 시청기록에서 랜덤 콘텐츠 가져오기 (최대 3개)
   */
  getRandomWatchedContents: async (limit: number = 3): Promise<RecommendedContent[]> => {
    const user = await requireAuth();

    const { data, error } = await supabaseClient
      .from('watch_history')
      .select(
        `
        content_id,
        content_type,
        contents!watch_history_content_fkey (
          title,
          poster_path
        )
      `,
      )
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .limit(20); // 충분히 가져와서 랜덤 선택

    if (error || !data || data.length === 0) {
      return [];
    }

    // 중복 제거
    const uniqueMap = new Map<string, RecommendedContent>();
    for (const item of data) {
      const key = `${item.content_id}-${item.content_type}`;
      if (!uniqueMap.has(key)) {
        const contentJoin = item.contents as { title?: string; poster_path?: string } | null;
        uniqueMap.set(key, {
          contentId: item.content_id,
          contentType: item.content_type,
          title: contentJoin?.title ?? '',
          posterPath: contentJoin?.poster_path ?? null,
        });
      }
    }

    // 배열로 변환 후 셔플
    const uniqueContents = Array.from(uniqueMap.values());
    for (let i = uniqueContents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = uniqueContents[i]!;
      uniqueContents[i] = uniqueContents[j]!;
      uniqueContents[j] = temp;
    }

    // 최대 limit개 반환
    return uniqueContents.slice(0, limit);
  },
};
