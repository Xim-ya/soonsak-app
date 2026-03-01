/**
 * Admin Registration API
 *
 * YouTube 영상/채널 등록 API
 * NestJS 백엔드 (Railway)를 직접 호출합니다.
 */

import { contentApi } from '@/features/content/api/contentApi';
import type { ContentType } from '@/shared/types/content/contentType.enum';

// ============================================================================
// Types
// ============================================================================

/** 단일 영상 등록 결과 */
export interface VideoRegistrationResult {
  success: boolean;
  videoId: string;
  contentId: number | null;
  contentType: 'movie' | 'tv' | null;
  contentCreated: boolean;
  videoTitle: string;
  contentTitle: string | null;
  posterPath?: string | null;
  error?: string;
}

/** 채널 영상 등록 결과 아이템 */
export interface ChannelRegistrationResultItem {
  videoId: string;
  videoTitle?: string;
  contentId?: number | null;
  contentType?: 'movie' | 'tv' | null;
  contentTitle?: string | null;
  posterPath?: string | null;
}

/** 채널 영상 등록 결과 (백엔드 응답 형식) */
export interface ChannelRegistrationResult {
  success: boolean;
  channelId: string;
  channelName: string;
  /** 전체 영상 수 */
  totalVideos?: number;
  /** 처리된 영상 수 */
  processedCount: number;
  /** 성공한 영상 수 */
  successCount: number;
  /** 등록된 영상 수 (successCount의 별칭) */
  registered: number;
  /** 실패한 영상 수 */
  failedCount: number;
  /** 실패한 영상 수 (failedCount의 별칭) */
  failed: number;
  /** 스킵된 영상 수 (이미 등록됨) */
  skippedCount: number;
  /** 스킵된 영상 수 (skippedCount의 별칭) */
  skipped: number;
  /** 스킵된 쇼츠 수 */
  skippedShortsCount: number;
  /** 등록된 영상 목록 */
  results?: ChannelRegistrationResultItem[];
  /** 에러 메시지들 */
  errors?: string[];
  /** 에러 메시지 (단일) */
  error?: string;
}

/** 일괄 영상 등록 결과 아이템 */
export interface BatchRegistrationResultItem {
  videoId: string;
  success: boolean;
  videoTitle?: string | undefined;
  contentId?: number | null | undefined;
  contentType?: 'movie' | 'tv' | null | undefined;
  contentTitle?: string | null | undefined;
  posterPath?: string | null | undefined;
  error?: string | undefined;
}

/** 일괄 영상 등록 결과 */
export interface BatchRegistrationResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  results: BatchRegistrationResultItem[];
}

// ============================================================================
// Constants
// ============================================================================

/** NestJS 백엔드 URL (Railway) */
const BACKEND_URL = 'https://web-production-17223.up.railway.app';

// ============================================================================
// API
// ============================================================================

export const adminRegistrationApi = {
  /**
   * 단일 YouTube 영상 등록
   *
   * YouTube에서 영상 정보를 가져와 TMDB에서 매칭되는 콘텐츠를 찾아 등록합니다.
   *
   * @param videoId - YouTube 영상 ID
   * @returns 등록 결과
   */
  registerVideo: async (videoId: string): Promise<VideoRegistrationResult> => {
    const url = `${BACKEND_URL}/videos/${videoId}/register`;
    console.log('[AdminRegistration] 영상 등록 요청:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminRegistration] 응답 상태:', response.status);

      const text = await response.text();
      console.log('[AdminRegistration] 응답 원본:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[AdminRegistration] JSON 파싱 실패:', text);
        return {
          success: false,
          videoId,
          contentId: null,
          contentType: null,
          contentCreated: false,
          videoTitle: '',
          contentTitle: null,
          error: `응답 파싱 실패: ${text.slice(0, 100)}`,
        };
      }

      if (!response.ok) {
        console.error('[AdminRegistration] 등록 실패:', data);
        return {
          success: false,
          videoId,
          contentId: null,
          contentType: null,
          contentCreated: false,
          videoTitle: '',
          contentTitle: null,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      // HTTP 200/201이지만 success: false인 경우 처리
      if (data.success === false) {
        console.log('[AdminRegistration] 등록 실패 (success: false):', data);
        return {
          success: false,
          videoId,
          contentId: null,
          contentType: null,
          contentCreated: false,
          videoTitle: data.videoTitle || '',
          contentTitle: null,
          error: data.message || data.error || '등록 실패',
        };
      }

      console.log('[AdminRegistration] 등록 성공:', data);
      return data;
    } catch (err) {
      console.error('[AdminRegistration] 네트워크 오류:', err);
      return {
        success: false,
        videoId,
        contentId: null,
        contentType: null,
        contentCreated: false,
        videoTitle: '',
        contentTitle: null,
        error: err instanceof Error ? err.message : '네트워크 오류',
      };
    }
  },

  /**
   * 여러 YouTube 영상 일괄 등록
   *
   * @param videoIds - YouTube 영상 ID 배열
   * @param onProgress - 진행 상태 콜백 (current, total)
   * @returns 일괄 등록 결과
   */
  registerVideos: async (
    videoIds: string[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<BatchRegistrationResult> => {
    const results: BatchRegistrationResult['results'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i]!;
      onProgress?.(i + 1, videoIds.length);

      try {
        const result = await adminRegistrationApi.registerVideo(videoId);

        if (result.success) {
          success++;
          results.push({
            videoId,
            success: true,
            videoTitle: result.videoTitle,
            contentId: result.contentId,
            contentType: result.contentType,
            contentTitle: result.contentTitle,
            posterPath: result.posterPath,
          });
        } else if (result.error && result.error.includes('already registered')) {
          skipped++;
          results.push({
            videoId,
            success: false,
            error: '이미 등록된 영상',
          });
        } else {
          failed++;
          results.push({
            videoId,
            success: false,
            error: result.error ?? '등록 실패',
          });
        }
      } catch (error) {
        failed++;
        results.push({
          videoId,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    // 성공한 결과들에 대해 Supabase에서 posterPath 조회
    const successResults = results.filter((r) => r.success && r.contentId && r.contentType);

    if (successResults.length > 0) {
      try {
        // movie와 tv를 분리해서 조회
        const movieIds = successResults
          .filter((r) => r.contentType === 'movie')
          .map((r) => r.contentId as number);
        const tvIds = successResults
          .filter((r) => r.contentType === 'tv')
          .map((r) => r.contentId as number);

        const [movies, tvShows] = await Promise.all([
          movieIds.length > 0
            ? contentApi.getContentsByTypeAndIds(movieIds, 'movie' as ContentType)
            : Promise.resolve([]),
          tvIds.length > 0
            ? contentApi.getContentsByTypeAndIds(tvIds, 'tv' as ContentType)
            : Promise.resolve([]),
        ]);

        // posterPath 매핑
        const posterMap = new Map<string, string>();
        [...movies, ...tvShows].forEach((content) => {
          if (content.posterPath) {
            posterMap.set(`${content.id}-${content.contentType}`, content.posterPath);
          }
        });

        // 결과에 posterPath 추가
        results.forEach((r) => {
          if (r.success && r.contentId && r.contentType) {
            const key = `${r.contentId}-${r.contentType}`;
            r.posterPath = posterMap.get(key) ?? null;
          }
        });
      } catch (err) {
        console.error('[AdminRegistration] posterPath 조회 실패:', err);
        // posterPath 조회 실패는 무시 (등록 결과는 유지)
      }
    }

    return {
      total: videoIds.length,
      success,
      failed,
      skipped,
      results,
    };
  },

  /**
   * 채널의 최근 영상 등록
   *
   * @param channelIdOrHandle - YouTube 채널 ID 또는 핸들 (@handle)
   * @param maxVideos - 등록할 최대 영상 수 (기본값: 10)
   * @returns 등록 결과
   */
  registerChannel: async (
    channelIdOrHandle: string,
    maxVideos: number = 10,
  ): Promise<ChannelRegistrationResult> => {
    // @ 제거 (핸들인 경우)
    const cleanId = channelIdOrHandle.startsWith('@')
      ? channelIdOrHandle.slice(1)
      : channelIdOrHandle;

    const url = `${BACKEND_URL}/channels/${cleanId}/register?maxVideos=${maxVideos}`;
    console.log('[AdminRegistration] 채널 등록 요청:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminRegistration] 응답 상태:', response.status);

      const text = await response.text();
      console.log('[AdminRegistration] 응답 원본:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[AdminRegistration] JSON 파싱 실패:', text);
        return {
          success: false,
          channelId: cleanId,
          channelName: '',
          processedCount: 0,
          successCount: 0,
          registered: 0,
          failedCount: 0,
          failed: 0,
          skippedCount: 0,
          skipped: 0,
          skippedShortsCount: 0,
          error: `응답 파싱 실패: ${text.slice(0, 100)}`,
        };
      }

      if (!response.ok) {
        console.error('[AdminRegistration] 등록 실패:', data);
        return {
          success: false,
          channelId: cleanId,
          channelName: '',
          processedCount: 0,
          successCount: 0,
          registered: 0,
          failedCount: 0,
          failed: 0,
          skippedCount: 0,
          skipped: 0,
          skippedShortsCount: 0,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      console.log('[AdminRegistration] 등록 성공:', data);
      // 백엔드 응답에 success 필드가 없으면 추가하고, 별칭 필드도 추가
      return {
        success: data.successCount > 0 || data.processedCount > 0,
        registered: data.successCount ?? 0,
        failed: data.failedCount ?? 0,
        skipped: data.skippedCount ?? 0,
        ...data,
      };
    } catch (err) {
      console.error('[AdminRegistration] 네트워크 오류:', err);
      return {
        success: false,
        channelId: cleanId,
        channelName: '',
        processedCount: 0,
        successCount: 0,
        registered: 0,
        failedCount: 0,
        failed: 0,
        skippedCount: 0,
        skipped: 0,
        skippedShortsCount: 0,
        error: err instanceof Error ? err.message : '네트워크 오류',
      };
    }
  },

  /**
   * 채널의 전체 영상 등록
   *
   * @param channelIdOrHandle - YouTube 채널 ID 또는 핸들 (@handle)
   * @param maxVideos - 등록할 최대 영상 수 (기본값: 10000)
   * @returns 등록 결과
   */
  registerChannelAll: async (
    channelIdOrHandle: string,
    maxVideos: number = 10000,
  ): Promise<ChannelRegistrationResult> => {
    // @ 제거 (핸들인 경우)
    const cleanId = channelIdOrHandle.startsWith('@')
      ? channelIdOrHandle.slice(1)
      : channelIdOrHandle;

    const url = `${BACKEND_URL}/channels/${cleanId}/register-all?maxVideos=${maxVideos}`;
    console.log('[AdminRegistration] 채널 전체 등록 요청:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminRegistration] 응답 상태:', response.status);

      const text = await response.text();
      console.log('[AdminRegistration] 응답 원본:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[AdminRegistration] JSON 파싱 실패:', text);
        return {
          success: false,
          channelId: cleanId,
          channelName: '',
          processedCount: 0,
          successCount: 0,
          registered: 0,
          failedCount: 0,
          failed: 0,
          skippedCount: 0,
          skipped: 0,
          skippedShortsCount: 0,
          error: `응답 파싱 실패: ${text.slice(0, 100)}`,
        };
      }

      if (!response.ok) {
        console.error('[AdminRegistration] 등록 실패:', data);
        return {
          success: false,
          channelId: cleanId,
          channelName: '',
          processedCount: 0,
          successCount: 0,
          registered: 0,
          failedCount: 0,
          failed: 0,
          skippedCount: 0,
          skipped: 0,
          skippedShortsCount: 0,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      console.log('[AdminRegistration] 등록 성공:', data);
      // 백엔드 응답에 success 필드가 없으면 추가하고, 별칭 필드도 추가
      return {
        success: data.successCount > 0 || data.processedCount > 0,
        registered: data.successCount ?? 0,
        failed: data.failedCount ?? 0,
        skipped: data.skippedCount ?? 0,
        ...data,
      };
    } catch (err) {
      console.error('[AdminRegistration] 네트워크 오류:', err);
      return {
        success: false,
        channelId: cleanId,
        channelName: '',
        processedCount: 0,
        successCount: 0,
        registered: 0,
        failedCount: 0,
        failed: 0,
        skippedCount: 0,
        skipped: 0,
        skippedShortsCount: 0,
        error: err instanceof Error ? err.message : '네트워크 오류',
      };
    }
  },
};
