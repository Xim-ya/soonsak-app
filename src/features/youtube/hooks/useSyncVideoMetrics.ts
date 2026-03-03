/**
 * useSyncVideoMetrics - YouTube 비디오 지표를 DB에 동기화하는 훅
 *
 * 스크래핑된 YouTube 데이터(조회수, 좋아요 수)를 Supabase videos 테이블에 저장합니다.
 * 오늘(KST 기준) 이미 업데이트된 비디오는 스킵합니다.
 *
 * @example
 * // ContentDetailProvider에서 사용
 * const { data: videoInfo } = useYouTubeVideo(videoUrl);
 *
 * useSyncVideoMetrics({
 *   videoId: primaryVideo?.id,
 *   viewCount: videoInfo?.metrics.viewCount,
 *   likeCount: videoInfo?.metrics.likeCount,
 * });
 */

import { useEffect, useRef } from 'react';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { YouTubeLogger } from '@/shared/utils/logger';

interface SyncVideoMetricsParams {
  /** YouTube 비디오 ID */
  videoId: string | undefined;
  /** 스크래핑된 조회수 */
  viewCount: number | undefined;
  /** 스크래핑된 좋아요 수 */
  likeCount: number | undefined;
}

interface SyncResult {
  updated: boolean;
  reason?: string;
  video_id?: string;
  view_count?: number;
  like_count?: number;
  updated_at?: string;
  last_updated_at?: string;
}

/**
 * 현재 KST 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getKstDateString(): string {
  const now = new Date();
  // KST = UTC + 9시간
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
}

/**
 * YouTube 비디오 지표를 DB에 동기화
 */
export function useSyncVideoMetrics({
  videoId,
  viewCount,
  likeCount,
}: SyncVideoMetricsParams): void {
  // 동일한 videoId + 날짜 조합으로 중복 호출 방지 (예: "abc123:2024-01-15")
  const syncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // 필수 데이터가 없으면 스킵
    if (!videoId || viewCount == null || likeCount == null) {
      return;
    }

    // 오늘 날짜 기준 dedupe 키 생성
    const todayKey = `${videoId}:${getKstDateString()}`;

    // 같은 날 이미 동기화한 비디오면 스킵
    if (syncedKeyRef.current === todayKey) {
      return;
    }

    const syncMetrics = async () => {
      try {
        const { data, error } = await supabaseClient.rpc('sync_video_metrics', {
          p_video_id: videoId,
          p_view_count: viewCount,
          p_like_count: likeCount,
        });

        if (error) {
          YouTubeLogger.error('비디오 지표 RPC 에러:', error);
          return;
        }

        const result = data as SyncResult;

        if (result.updated) {
          YouTubeLogger.log('비디오 지표 업데이트 완료:', {
            videoId: result.video_id,
            viewCount: result.view_count,
            likeCount: result.like_count,
          });
        } else {
          YouTubeLogger.log('비디오 지표 업데이트 스킵:', result.reason);
        }

        // 동기화 완료 표시 (날짜 포함 키)
        syncedKeyRef.current = todayKey;
      } catch (error) {
        YouTubeLogger.error('비디오 지표 동기화 실패:', error);
      }
    };

    syncMetrics();
  }, [videoId, viewCount, likeCount]);
}
