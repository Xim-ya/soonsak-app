/**
 * useContentRegistration - 콘텐츠 등록 훅
 *
 * 전역 서비스를 통해 영상/채널 등록을 관리합니다.
 * 화면을 이탈해도 등록이 계속 진행되며, 완료 시 푸시 알림이 발송됩니다.
 */

import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  parseYouTubeChannelUrl,
  parseMultipleVideoUrls,
  type BatchRegistrationResult,
  type ChannelRegistrationResult,
} from '@/features/admin';
import {
  contentRegistrationService,
  type RegistrationState,
} from '@/features/admin/services/contentRegistrationService';

// ============================================================================
// Types
// ============================================================================

type RegistrationTab = 'video' | 'channel';

type ChannelRegisterMode = 'recent' | 'all';

interface UseContentRegistrationReturn {
  // Tab State
  readonly activeTab: RegistrationTab;
  readonly setActiveTab: (tab: RegistrationTab) => void;

  // Video Registration
  readonly videoUrlInput: string;
  readonly setVideoUrlInput: (value: string) => void;
  readonly videoRegistrationResult: BatchRegistrationResult | null;
  readonly isRegisteringVideos: boolean;
  readonly registerVideos: () => void;
  readonly videoProgress: { current: number; total: number } | null;

  // Channel Registration
  readonly channelUrlInput: string;
  readonly setChannelUrlInput: (value: string) => void;
  readonly channelRegisterMode: ChannelRegisterMode;
  readonly setChannelRegisterMode: (mode: ChannelRegisterMode) => void;
  readonly recentVideoCount: number;
  readonly setRecentVideoCount: (count: number) => void;
  readonly channelRegistrationResult: ChannelRegistrationResult | null;
  readonly isRegisteringChannel: boolean;
  readonly registerChannel: () => void;

  // Common
  readonly clearResults: () => void;
  readonly error: string | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useContentRegistration(): UseContentRegistrationReturn {
  // Tab state
  const [activeTab, setActiveTab] = useState<RegistrationTab>('video');

  // Video registration input state
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Channel registration input state
  const [channelUrlInput, setChannelUrlInput] = useState('');
  const [channelRegisterMode, setChannelRegisterMode] = useState<ChannelRegisterMode>('recent');
  const [recentVideoCount, setRecentVideoCount] = useState(10);

  // 서비스 상태 구독
  const [serviceState, setServiceState] = useState<RegistrationState | null>(
    contentRegistrationService.getState(),
  );

  // Local error state (validation errors)
  const [localError, setLocalError] = useState<string | null>(null);

  // 서비스 상태 변경 구독
  useEffect(() => {
    const unsubscribe = contentRegistrationService.subscribe(setServiceState);
    return unsubscribe;
  }, []);

  // 화면 focus 시 서비스 상태 동기화 (푸시 딥링크 진입 대응)
  useFocusEffect(
    useCallback(() => {
      setServiceState(contentRegistrationService.getState());
    }, []),
  );

  // 서비스 상태에서 파생된 값들
  const isRegisteringVideos =
    serviceState?.type === 'video' && serviceState.isRunning;
  const isRegisteringChannel =
    serviceState?.type === 'channel' && serviceState.isRunning;

  const videoProgress =
    serviceState?.type === 'video' ? serviceState.progress : null;

  const videoRegistrationResult =
    serviceState?.type === 'video' && !serviceState.isRunning
      ? serviceState.result
      : null;

  const channelRegistrationResult =
    serviceState?.type === 'channel' && !serviceState.isRunning
      ? serviceState.result
      : null;

  const serviceError =
    serviceState && !serviceState.isRunning ? serviceState.error : null;

  // Register videos
  const registerVideos = useCallback(() => {
    // 이미 등록 진행 중이면 무시
    if (contentRegistrationService.isRunning()) {
      return;
    }

    setLocalError(null);

    if (!videoUrlInput.trim()) {
      setLocalError('URL을 입력해주세요');
      return;
    }

    // Parse URLs
    const parsed = parseMultipleVideoUrls(videoUrlInput);
    const validVideoIds = parsed
      .filter((p) => p.result.success && p.result.videoId)
      .map((p) => p.result.videoId!);

    if (validVideoIds.length === 0) {
      setLocalError('유효한 YouTube 영상 URL이 없습니다');
      return;
    }

    // 서비스에서 백그라운드로 실행 (await 하지 않음)
    contentRegistrationService.registerVideos(validVideoIds);
  }, [videoUrlInput]);

  // Register channel
  const registerChannel = useCallback(() => {
    // 이미 등록 진행 중이면 무시
    if (contentRegistrationService.isRunning()) {
      return;
    }

    setLocalError(null);

    if (!channelUrlInput.trim()) {
      setLocalError('채널 URL을 입력해주세요');
      return;
    }

    // Parse channel URL
    const parsed = parseYouTubeChannelUrl(channelUrlInput);
    if (!parsed.success) {
      setLocalError(parsed.error || '유효한 YouTube 채널 URL이 아닙니다');
      return;
    }

    const channelIdOrHandle = parsed.channelId || parsed.channelHandle;
    if (!channelIdOrHandle) {
      setLocalError('채널 ID를 추출할 수 없습니다');
      return;
    }

    // 서비스에서 백그라운드로 실행 (await 하지 않음)
    contentRegistrationService.registerChannel(
      channelIdOrHandle,
      channelRegisterMode,
      recentVideoCount,
    );
  }, [channelUrlInput, channelRegisterMode, recentVideoCount]);

  // Clear results
  const clearResults = useCallback(() => {
    contentRegistrationService.clearResult();
    setLocalError(null);
  }, []);

  return {
    // Tab
    activeTab,
    setActiveTab,

    // Video
    videoUrlInput,
    setVideoUrlInput,
    videoRegistrationResult,
    isRegisteringVideos,
    registerVideos,
    videoProgress,

    // Channel
    channelUrlInput,
    setChannelUrlInput,
    channelRegisterMode,
    setChannelRegisterMode,
    recentVideoCount,
    setRecentVideoCount,
    channelRegistrationResult,
    isRegisteringChannel,
    registerChannel,

    // Common
    clearResults,
    error: localError || serviceError,
  };
}

export type { RegistrationTab, ChannelRegisterMode };
