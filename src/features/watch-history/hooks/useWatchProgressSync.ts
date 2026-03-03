/**
 * useWatchProgressSync - 시청 진행률 동기화 훅
 *
 * 동기화 전략:
 * - 첫 재생 5초 후 초기 동기화 (짧은 재생 세션 지원)
 * - 20초 간격 자동 동기화
 * - 일시정지 시 즉시 동기화
 * - 페이지 이탈 시 즉시 동기화
 * - Seek(탐색) 시 debounce 동기화 (3초 이상 시간 점프 감지, 300ms 대기)
 */

import { useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/shared/providers/AuthProvider';
import { Logger } from '@/shared/utils/logger';
import { watchHistoryApi } from '../api/watchHistoryApi';
import type { ContentType } from '@/shared/types/content/contentType.enum';

const WatchProgressLogger = Logger.create('WatchProgress');

/** YouTube 플레이어 상태 상수 */
const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

/** 동기화 간격 (밀리초) */
const SYNC_INTERVAL_MS = 20_000;

/** 초기 동기화 딜레이 (밀리초) - 짧은 재생 세션 지원 */
const INITIAL_SYNC_DELAY_MS = 5_000;

/** Seek 감지 임계값 (초) - 이 값 이상 시간 점프 시 seek로 간주 */
const SEEK_THRESHOLD_SECONDS = 3;

/** Seek 동기화 debounce 딜레이 (밀리초) */
const SEEK_DEBOUNCE_MS = 300;

/** 쿼리 무효화용 watchHistory 기본 키 */
const WATCH_HISTORY_QUERY_KEY = ['watchHistory'] as const;

interface UseWatchProgressSyncParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
}

interface WatchProgressSyncResult {
  /** 진행률 업데이트 (1초마다 호출) */
  updateProgress: (currentTime: number, duration: number) => void;
  /** 플레이어 상태 변경 핸들러 */
  handleStateChange: (state: number) => void;
  /** 즉시 동기화 (페이지 이탈 시 호출) */
  syncNow: () => Promise<void>;
}

export function useWatchProgressSync({
  contentId,
  contentType,
  videoId,
}: UseWatchProgressSyncParams): WatchProgressSyncResult {
  const { user } = useAuth();
  const isLoggedIn = user !== null;
  const queryClient = useQueryClient();
  const progressRef = useRef({ currentTime: 0, duration: 0 });
  const lastSyncTimeRef = useRef(0);
  const lastProgressTimeRef = useRef(0); // seek 감지용 이전 재생 시간
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); // seek debounce 타이머
  const initialSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 초기 동기화 타이머
  const isSyncingRef = useRef(false);
  const hasInitialSyncRef = useRef(false); // 초기 동기화 완료 여부

  /** 서버에 진행률 동기화 */
  const syncToServer = useCallback(async () => {
    // 비로그인 상태면 동기화 스킵
    if (!isLoggedIn) return;

    const { currentTime, duration } = progressRef.current;

    const hasValidProgress = currentTime > 0 && duration > 0;
    if (!hasValidProgress) return;

    const isAlreadySyncing = isSyncingRef.current;
    if (isAlreadySyncing) return;

    isSyncingRef.current = true;

    try {
      await watchHistoryApi.updateWatchProgress({
        contentId,
        contentType,
        videoId,
        progressSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(duration),
      });
      lastSyncTimeRef.current = Date.now();
      hasInitialSyncRef.current = true;

      // 동기화 성공 후 관련 쿼리 무효화 (watchHistory로 시작하는 모든 쿼리)
      queryClient.invalidateQueries({ queryKey: WATCH_HISTORY_QUERY_KEY });
    } catch (error) {
      WatchProgressLogger.error('시청 진행률 동기화 실패:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isLoggedIn, contentId, contentType, videoId, queryClient]);

  /** 영상 완료 처리 (끝까지 재생 시) */
  const markComplete = useCallback(async () => {
    // 비로그인 상태면 스킵
    if (!isLoggedIn) return;

    const { duration } = progressRef.current;
    if (duration <= 0) return;

    try {
      await watchHistoryApi.markAsFullyWatched(
        contentId,
        contentType,
        Math.floor(duration),
        videoId,
      );

      // 완료 처리 후 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: WATCH_HISTORY_QUERY_KEY });
    } catch (error) {
      WatchProgressLogger.error('영상 완료 처리 실패:', error);
    }
  }, [isLoggedIn, contentId, contentType, videoId, queryClient]);

  /** 초기 동기화 스케줄 (첫 5초 후) */
  const scheduleInitialSync = useCallback(() => {
    // 비로그인 상태면 스킵
    if (!isLoggedIn) return;

    // 이미 초기 동기화 완료했거나 타이머가 있으면 스킵
    if (hasInitialSyncRef.current || initialSyncTimerRef.current) {
      return;
    }

    initialSyncTimerRef.current = setTimeout(() => {
      syncToServer();
      initialSyncTimerRef.current = null;
    }, INITIAL_SYNC_DELAY_MS);
  }, [isLoggedIn, syncToServer]);

  /** 진행률 업데이트 (1초마다 플레이어에서 호출) */
  const updateProgress = useCallback(
    (currentTime: number, duration: number) => {
      const lastTime = lastProgressTimeRef.current;
      const timeDiff = Math.abs(currentTime - lastTime);

      const hasTimeJump = lastTime > 0 && timeDiff >= SEEK_THRESHOLD_SECONDS;

      progressRef.current = { currentTime, duration };
      lastProgressTimeRef.current = currentTime;

      // 유효한 duration이 있으면 초기 동기화 스케줄
      if (duration > 0 && !hasInitialSyncRef.current) {
        scheduleInitialSync();
      }

      if (hasTimeJump) {
        if (seekDebounceRef.current) {
          clearTimeout(seekDebounceRef.current);
        }
        seekDebounceRef.current = setTimeout(() => {
          syncToServer();
          seekDebounceRef.current = null;
        }, SEEK_DEBOUNCE_MS);
      }
    },
    [syncToServer, scheduleInitialSync],
  );

  /** 주기적 동기화 시작 */
  const startPeriodicSync = useCallback(() => {
    // 비로그인 상태면 주기적 동기화 시작하지 않음
    if (!isLoggedIn) return;

    if (syncIntervalRef.current) {
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
      if (timeSinceLastSync >= SYNC_INTERVAL_MS) {
        syncToServer();
      }
    }, SYNC_INTERVAL_MS);
  }, [isLoggedIn, syncToServer]);

  /** 주기적 동기화 중지 */
  const stopPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  /** 플레이어 상태 변경 핸들러 */
  const handleStateChange = useCallback(
    (state: number) => {
      if (state === PLAYER_STATE.PLAYING) {
        startPeriodicSync();
      } else if (state === PLAYER_STATE.PAUSED) {
        stopPeriodicSync();
        syncToServer();
      } else if (state === PLAYER_STATE.ENDED) {
        // 영상이 끝까지 재생됨 - 확실하게 완료 처리
        stopPeriodicSync();
        markComplete();
      }
    },
    [startPeriodicSync, stopPeriodicSync, syncToServer, markComplete],
  );

  /** 즉시 동기화 (외부에서 호출 가능) */
  const syncNow = useCallback(async () => {
    stopPeriodicSync();
    await syncToServer();
  }, [stopPeriodicSync, syncToServer]);

  // AppState 변경 시 백그라운드로 전환되면 동기화 (로그인 상태에서만)
  useEffect(() => {
    // 비로그인 상태면 리스너 등록하지 않음
    if (!isLoggedIn) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // 앱이 백그라운드로 가면 즉시 동기화 시도
        syncToServer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, syncToServer]);

  // cleanup on unmount (로그인 상태에서만 동기화 시도)
  useEffect(() => {
    return () => {
      stopPeriodicSync();

      if (seekDebounceRef.current) {
        clearTimeout(seekDebounceRef.current);
      }

      if (initialSyncTimerRef.current) {
        clearTimeout(initialSyncTimerRef.current);
      }

      // 비로그인 상태면 동기화 스킵
      if (!isLoggedIn) return;

      // 컴포넌트 언마운트 시 마지막 동기화 시도 (fire-and-forget)
      // 유효한 진행률이 있고 아직 동기화하지 않은 경우에만
      const { currentTime, duration } = progressRef.current;
      if (currentTime > 0 && duration > 0) {
        watchHistoryApi
          .updateWatchProgress({
            contentId,
            contentType,
            videoId,
            progressSeconds: Math.floor(currentTime),
            durationSeconds: Math.floor(duration),
          })
          .catch(() => {
            // 에러 무시 - cleanup 중이므로 로깅만 하지 않음
          });
      }
    };
  }, [isLoggedIn, stopPeriodicSync, contentId, contentType, videoId]);

  return {
    updateProgress,
    handleStateChange,
    syncNow,
  };
}
