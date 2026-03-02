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
 * YouTube 비디오 지표를 DB에 동기화
 */
export function useSyncVideoMetrics({ videoId, viewCount, likeCount }: SyncVideoMetricsParams): void {
  // 동일한 videoId로 중복 호출 방지
  const syncedVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 필수 데이터가 없으면 스킵
    if (!videoId || viewCount == null || likeCount == null) {
      return;
    }

    // 이미 동기화한 비디오면 스킵
    if (syncedVideoIdRef.current === videoId) {
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
          console.error('[useSyncVideoMetrics] RPC 에러:', error);
          return;
        }

        const result = data as SyncResult;

        if (result.updated) {
          console.log('[useSyncVideoMetrics] 비디오 지표 업데이트 완료:', {
            videoId: result.video_id,
            viewCount: result.view_count,
            likeCount: result.like_count,
          });
        } else {
          console.log('[useSyncVideoMetrics] 업데이트 스킵:', result.reason);
        }

        // 동기화 완료 표시
        syncedVideoIdRef.current = videoId;
      } catch (error) {
        console.error('[useSyncVideoMetrics] 동기화 실패:', error);
      }
    };

    syncMetrics();
  }, [videoId, viewCount, likeCount]);
}
