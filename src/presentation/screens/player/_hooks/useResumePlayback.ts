/**
 * useResumePlayback - 이어보기 로직
 *
 * 역할:
 * - 재생 시작 시 저장된 위치로 이동 (1회만)
 * - stateChange 이벤트에서 PLAYING 상태 감지 시 seekTo 처리
 */

import { useRef, useCallback } from 'react';
import type { useYouTubePlayer } from 'react-native-youtube-bridge';

/** YouTube 플레이어 PLAYING 상태 */
const PLAYER_STATE_PLAYING = 1;

interface UseResumePlaybackParams {
  readonly startSeconds: number | undefined;
  readonly player: ReturnType<typeof useYouTubePlayer>;
}

interface ResumePlaybackResult {
  /** stateChange 이벤트에서 이어보기 처리 */
  readonly handleResumeOnStateChange: (stateValue: number) => void;
}

export function useResumePlayback({
  startSeconds,
  player,
}: UseResumePlaybackParams): ResumePlaybackResult {
  const hasSeekToStart = useRef(false);

  const handleResumeOnStateChange = useCallback(
    (stateValue: number) => {
      const shouldSeekToStart =
        stateValue === PLAYER_STATE_PLAYING &&
        startSeconds !== undefined &&
        startSeconds > 0 &&
        !hasSeekToStart.current;

      if (shouldSeekToStart) {
        hasSeekToStart.current = true;
        player.seekTo(startSeconds, true);
      }
    },
    [startSeconds, player],
  );

  return {
    handleResumeOnStateChange,
  };
}
