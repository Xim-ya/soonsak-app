/**
 * usePlayerReady - 플레이어 준비 및 초기화 로직
 *
 * 역할:
 * - 플레이어 준비 상태 관리
 * - ready 이벤트 처리
 * - 재생수 증가 + 시청 기록 저장 (1회만)
 * - iOS 음소거 해제
 */

import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import type { useYouTubePlayer } from 'react-native-youtube-bridge';
import { contentApi } from '@/features/content/api/contentApi';
import { useAddWatchHistory } from '@/features/watch-history';
import { useAuth } from '@/shared/providers/AuthProvider';
import type { ContentType } from '@/shared/types/content/contentType.enum';
import { PlayerLogger } from '@/shared/utils/logger';

interface UsePlayerReadyParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
  readonly isFallbackMode: boolean;
  readonly player: ReturnType<typeof useYouTubePlayer>;
}

interface PlayerReadyResult {
  readonly isPlayerReady: boolean;
  /** ready 이벤트 핸들러 - useYouTubeEvent에 전달 */
  readonly handleReady: () => void;
}

export function usePlayerReady({
  contentId,
  contentType,
  videoId,
  isFallbackMode,
  player,
}: UsePlayerReadyParams): PlayerReadyResult {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const hasIncrementedPlayCount = useRef(false);
  const unmuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const isLoggedIn = user !== null;
  const { mutate: addWatchHistory } = useAddWatchHistory();

  const handleReady = () => {
    PlayerLogger.log('플레이어 준비 완료');

    if (!isFallbackMode) {
      setIsPlayerReady(true);
    }

    // 재생수 증가 + 시청 기록 저장 (1회만 실행)
    const shouldTrackPlayCount = !hasIncrementedPlayCount.current;
    if (shouldTrackPlayCount) {
      hasIncrementedPlayCount.current = true;
      contentApi.incrementPlayCount(contentId, contentType);

      // 로그인 상태에서만 시청 기록 저장
      if (isLoggedIn) {
        addWatchHistory({
          contentId,
          contentType,
          videoId,
        });
      }
    }

    // iOS에서 음소거 상태로 자동 재생 후 음소거 해제
    if (Platform.OS === 'ios') {
      unmuteTimeoutRef.current = setTimeout(() => {
        player.unMute();
      }, 500);
    }
  };

  // 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (unmuteTimeoutRef.current) {
        clearTimeout(unmuteTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPlayerReady,
    handleReady,
  };
}
