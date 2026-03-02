/**
 * useChannelFavoriteAction - 채널 찜하기 액션 상태 관리 훅
 *
 * 채널 찜하기 관련 상태(로그인 다이얼로그)를 관리합니다.
 * Discussion #42: 다이얼로그 상태 관리 패턴 적용
 *
 * 로그인 관련 로직은 LoginPromptDialog 내부에 응집되어 있습니다.
 * (Toss Frontend Fundamentals - 응집도 원칙 적용)
 */

import { useCallback, useState, useRef } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useChannelFavoriteStatus, useToggleChannelFavorite } from '@/features/channel-favorites';

interface UseChannelFavoriteActionParams {
  readonly channelId: string;
}

interface UseChannelFavoriteActionReturn {
  /** 찜 상태 */
  readonly isFavorited: boolean;
  /** 찜 토글 진행 중 여부 */
  readonly isToggling: boolean;
  /** 로그인 다이얼로그 표시 여부 */
  readonly isLoginDialogVisible: boolean;
  /** 찜 토글 핸들러 */
  readonly handleToggleFavorite: () => void;
  /** 로그인 다이얼로그 닫기 */
  readonly handleCloseDialog: () => void;
  /** 로그인 성공 시 콜백 (LoginPromptDialog용) */
  readonly loginSuccessCallback: (() => void) | undefined;
}

export function useChannelFavoriteAction({
  channelId,
}: UseChannelFavoriteActionParams): UseChannelFavoriteActionReturn {
  // 인증 상태
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';

  // 채널 찜 상태 및 토글
  const { data: favoriteStatus } = useChannelFavoriteStatus(channelId);
  const { mutate: toggleFavorite, isPending } = useToggleChannelFavorite();

  // 중복 요청 방지를 위한 ref
  const isProcessingRef = useRef(false);
  const lastCallTimeRef = useRef(0);
  const DEBOUNCE_MS = 500;

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  // 로그인 성공 시 자동 찜 등록을 위한 플래그
  const [pendingAction, setPendingAction] = useState<'favorite' | null>(null);

  // 로그인 성공 시 콜백 함수
  const executeLoginSuccessCallback = useCallback(() => {
    setPendingAction(null);
    // 로그인 후 찜 등록 실행
    toggleFavorite({ channelId });
  }, [toggleFavorite, channelId]);

  // 로그인 성공 시 콜백 (pendingAction이 있을 때만)
  const loginSuccessCallback = pendingAction ? executeLoginSuccessCallback : undefined;

  // 찜 토글 핸들러 (비로그인 시 로그인 유도, 중복 요청 방지)
  const handleToggleFavorite = useCallback(() => {
    if (!isLoggedIn) {
      setPendingAction('favorite');
      setLoginDialogVisible(true);
      return;
    }

    const now = Date.now();

    // 중복 요청 방지: 디바운스 시간 내 또는 mutation 진행 중이면 무시
    if (isPending || isProcessingRef.current || now - lastCallTimeRef.current < DEBOUNCE_MS) {
      return;
    }

    lastCallTimeRef.current = now;
    isProcessingRef.current = true;
    toggleFavorite(
      { channelId },
      {
        onSettled: () => {
          isProcessingRef.current = false;
        },
      },
    );
  }, [isLoggedIn, channelId, toggleFavorite, isPending]);

  // 로그인 다이얼로그 닫기
  const handleCloseDialog = useCallback(() => {
    setLoginDialogVisible(false);
    setPendingAction(null);
  }, []);

  return {
    isFavorited: favoriteStatus?.isFavorited ?? false,
    isToggling: isPending,
    isLoginDialogVisible,
    handleToggleFavorite,
    handleCloseDialog,
    loginSuccessCallback,
  };
}
