/**
 * useFavoriteAction - 찜하기 액션 상태 관리 훅
 *
 * 찜하기 관련 상태(로그인 다이얼로그, 액션 바텀시트)를 관리합니다.
 * Discussion #42: 다이얼로그 상태 관리 패턴 적용
 *
 * 로그인 관련 로직은 LoginPromptDialog 내부에 응집되어 있습니다.
 * (Toss Frontend Fundamentals - 응집도 원칙 적용)
 */

import { useCallback, useState, useRef } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useFavoriteStatus, useToggleFavorite } from '@/features/favorites';
import type { ContentType } from '@/presentation/types/content/contentType.enum';

interface UseFavoriteActionParams {
  readonly contentId: number;
  readonly contentType: ContentType;
}

interface UseFavoriteActionReturn {
  /** 찜 상태 */
  readonly isFavorited: boolean;
  /** 찜 토글 진행 중 여부 */
  readonly isToggling: boolean;
  /** 로그인 다이얼로그 표시 여부 */
  readonly isLoginDialogVisible: boolean;
  /** 액션 바텀시트 표시 여부 */
  readonly isActionSheetVisible: boolean;
  /** 더보기 버튼 클릭 핸들러 */
  readonly handleMorePress: () => void;
  /** 찜 토글 핸들러 */
  readonly handleToggleFavorite: () => void;
  /** 액션 바텀시트 닫기 */
  readonly handleCloseActionSheet: () => void;
  /** 로그인 다이얼로그 닫기 */
  readonly handleCloseDialog: () => void;
}

export function useFavoriteAction({
  contentId,
  contentType,
}: UseFavoriteActionParams): UseFavoriteActionReturn {
  // 인증 상태
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';

  // 찜 상태 및 토글
  const { data: favoriteStatus } = useFavoriteStatus(contentId, contentType);
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();

  // 중복 요청 방지를 위한 ref
  const isProcessingRef = useRef(false);
  const lastCallTimeRef = useRef(0);
  const DEBOUNCE_MS = 500;

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  // 액션 바텀시트 상태
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);

  // 더보기 버튼 클릭 핸들러 (로그인 여부와 관계없이 바텀시트 표시)
  const handleMorePress = useCallback(() => {
    setActionSheetVisible(true);
  }, []);

  // 찜 토글 핸들러 (비로그인 시 로그인 유도, 중복 요청 방지)
  const handleToggleFavorite = useCallback(() => {
    if (!isLoggedIn) {
      setActionSheetVisible(false);
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
      { contentId, contentType },
      {
        onSettled: () => {
          isProcessingRef.current = false;
        },
      },
    );
  }, [isLoggedIn, contentId, contentType, toggleFavorite, isPending]);

  // 액션 바텀시트 닫기
  const handleCloseActionSheet = useCallback(() => {
    setActionSheetVisible(false);
  }, []);

  // 로그인 다이얼로그 닫기
  const handleCloseDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

  return {
    isFavorited: favoriteStatus?.isFavorited ?? false,
    isToggling: isPending,
    isLoginDialogVisible,
    isActionSheetVisible,
    handleMorePress,
    handleToggleFavorite,
    handleCloseActionSheet,
    handleCloseDialog,
  };
}
