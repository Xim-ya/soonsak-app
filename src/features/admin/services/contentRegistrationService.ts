/**
 * Content Registration Service
 *
 * 영상/채널 등록을 백그라운드에서 실행하는 전역 서비스입니다.
 * 화면을 이탈해도 등록이 계속 진행되며, 완료 시 푸시 알림을 발송합니다.
 */

import {
  adminRegistrationApi,
  type BatchRegistrationResult,
  type ChannelRegistrationResult,
} from '../api/adminRegistrationApi';
import {
  sendContentRegistrationCompleteNotification,
  sendChannelRegistrationCompleteNotification,
} from '@/shared/utils/localNotification';

// ============================================================================
// Types
// ============================================================================

type RegistrationType = 'video' | 'channel';

interface VideoRegistrationState {
  type: 'video';
  isRunning: boolean;
  progress: { current: number; total: number } | null;
  result: BatchRegistrationResult | null;
  error: string | null;
}

interface ChannelRegistrationState {
  type: 'channel';
  isRunning: boolean;
  channelName: string | null;
  result: ChannelRegistrationResult | null;
  error: string | null;
}

type RegistrationState = VideoRegistrationState | ChannelRegistrationState;

type StateListener = (state: RegistrationState | null) => void;

// ============================================================================
// Service
// ============================================================================

class ContentRegistrationService {
  private state: RegistrationState | null = null;
  private listeners: Set<StateListener> = new Set();

  /** 현재 상태 조회 */
  getState(): RegistrationState | null {
    return this.state;
  }

  /** 등록 진행 중 여부 */
  isRunning(): boolean {
    return this.state?.isRunning ?? false;
  }

  /** 상태 변경 리스너 등록 */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // 즉시 현재 상태 전달
    listener(this.state);
    // unsubscribe 함수 반환
    return () => this.listeners.delete(listener);
  }

  /** 상태 업데이트 및 리스너 알림 */
  private updateState(state: RegistrationState | null): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }

  /** 결과 초기화 */
  clearResult(): void {
    if (this.state && !this.state.isRunning) {
      this.updateState(null);
    }
  }

  /**
   * 영상 일괄 등록 시작 (백그라운드)
   */
  async registerVideos(videoIds: string[]): Promise<void> {
    if (this.isRunning()) {
      console.warn('[RegistrationService] 이미 등록 진행 중');
      return;
    }

    // 초기 상태 설정
    this.updateState({
      type: 'video',
      isRunning: true,
      progress: { current: 0, total: videoIds.length },
      result: null,
      error: null,
    });

    try {
      const result = await adminRegistrationApi.registerVideos(
        videoIds,
        (current, total) => {
          // 진행 상태 업데이트
          this.updateState({
            type: 'video',
            isRunning: true,
            progress: { current, total },
            result: null,
            error: null,
          });
        },
      );

      // 완료 상태 설정
      this.updateState({
        type: 'video',
        isRunning: false,
        progress: null,
        result,
        error: null,
      });

      // 푸시 알림 발송
      await sendContentRegistrationCompleteNotification(result.success, result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '등록 중 오류가 발생했습니다';
      this.updateState({
        type: 'video',
        isRunning: false,
        progress: null,
        result: null,
        error: errorMessage,
      });
    }
  }

  /**
   * 채널 등록 시작 (백그라운드)
   */
  async registerChannel(
    channelIdOrHandle: string,
    mode: 'recent' | 'all',
    recentVideoCount: number = 10,
  ): Promise<void> {
    if (this.isRunning()) {
      console.warn('[RegistrationService] 이미 등록 진행 중');
      return;
    }

    // 초기 상태 설정
    this.updateState({
      type: 'channel',
      isRunning: true,
      channelName: channelIdOrHandle,
      result: null,
      error: null,
    });

    try {
      const result =
        mode === 'all'
          ? await adminRegistrationApi.registerChannelAll(channelIdOrHandle)
          : await adminRegistrationApi.registerChannel(channelIdOrHandle, recentVideoCount);

      // 완료 상태 설정
      this.updateState({
        type: 'channel',
        isRunning: false,
        channelName: result.channelName || channelIdOrHandle,
        result,
        error: null,
      });

      // 푸시 알림 발송
      if (result.success) {
        await sendChannelRegistrationCompleteNotification(
          result.channelName || channelIdOrHandle,
          result.registered,
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '등록 중 오류가 발생했습니다';
      this.updateState({
        type: 'channel',
        isRunning: false,
        channelName: channelIdOrHandle,
        result: null,
        error: errorMessage,
      });
    }
  }
}

// 싱글톤 인스턴스
export const contentRegistrationService = new ContentRegistrationService();

// 타입 export
export type {
  RegistrationState,
  VideoRegistrationState,
  ChannelRegistrationState,
  RegistrationType,
};
