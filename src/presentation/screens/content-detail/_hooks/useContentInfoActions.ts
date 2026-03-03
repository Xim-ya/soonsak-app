/**
 * useContentInfoActions - 콘텐츠 정보 영역의 찜/평점 액션 관리 훅
 *
 * 책임:
 * - 찜 상태 및 토글
 * - 평점 상태 및 등록
 * - 로그인 다이얼로그 상태
 * - 평점 바텀시트 상태
 * - 로그인 성공 콜백 제공
 *
 * Toss Frontend Fundamentals - 응집도 원칙:
 * 같은 목적의 코드(찜/평점 액션)를 한 곳에 뭉쳐서 관리합니다.
 */

import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useFavoriteStatus, useToggleFavorite } from '@/features/favorites';
import { useRatingStatus, useSetRating } from '@/features/ratings';
import type { ContentType } from '@/shared/types/content/contentType.enum';

interface UseContentInfoActionsParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly contentTitle: string;
}

interface UseContentInfoActionsReturn {
  /** 찜 상태 */
  readonly isFavorited: boolean;
  /** 평점 상태 */
  readonly hasRating: boolean;
  /** 현재 평점 (0.5~5.0) */
  readonly currentRating: number | null;
  /** 로그인 다이얼로그 표시 여부 */
  readonly isLoginDialogVisible: boolean;
  /** 평점 바텀시트 표시 여부 */
  readonly isRatingSheetVisible: boolean;
  /** 찜 버튼 클릭 핸들러 */
  readonly handleFavoritePress: () => void;
  /** 평점 버튼 클릭 핸들러 */
  readonly handleRatingPress: () => void;
  /** 평점 등록 핸들러 */
  readonly handleSubmitRating: (rating: number) => void;
  /** 평점 바텀시트 닫기 */
  readonly handleCloseRatingSheet: () => void;
  /** 로그인 다이얼로그 닫기 */
  readonly handleCloseDialog: () => void;
  /** 로그인 성공 시 실행할 콜백 (LoginPromptDialog에 전달) */
  readonly loginSuccessCallback: (() => void) | undefined;
}

export function useContentInfoActions({
  contentId,
  contentType,
  contentTitle,
}: UseContentInfoActionsParams): UseContentInfoActionsReturn {
  // 인증 상태
  const { status, displayName } = useAuth();
  const isLoggedIn = status === 'authenticated';

  // 찜 상태 및 토글
  const { data: favoriteStatus } = useFavoriteStatus(contentId, contentType);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const isFavorited = favoriteStatus?.isFavorited ?? false;

  // 평점 상태 및 등록
  const { data: ratingStatus } = useRatingStatus(contentId, contentType);
  const { mutate: setRating } = useSetRating();
  const hasRating = ratingStatus?.hasRating ?? false;
  const currentRating = ratingStatus?.rating ?? null;

  // 로컬 상태: 어떤 액션이 pending인지 추적
  const [pendingAction, setPendingAction] = useState<'favorite' | 'rating' | null>(null);

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  // 평점 바텀시트 상태
  const [isRatingSheetVisible, setRatingSheetVisible] = useState(false);

  // 찜 버튼 클릭 핸들러
  const handleFavoritePress = useCallback(() => {
    if (!isLoggedIn) {
      setPendingAction('favorite');
      setLoginDialogVisible(true);
      return;
    }
    toggleFavorite({ contentId, contentType, nickname: displayName, videoTitle: contentTitle });
  }, [isLoggedIn, contentId, contentType, toggleFavorite, displayName, contentTitle]);

  // 평점 버튼 클릭 핸들러
  const handleRatingPress = useCallback(() => {
    if (!isLoggedIn) {
      setPendingAction('rating');
      setLoginDialogVisible(true);
      return;
    }
    setRatingSheetVisible(true);
  }, [isLoggedIn]);

  // 평점 등록 핸들러
  const handleSubmitRating = useCallback(
    (rating: number) => {
      setRating({ contentId, contentType, rating, contentTitle });
    },
    [contentId, contentType, contentTitle, setRating],
  );

  // 평점 바텀시트 닫기
  const handleCloseRatingSheet = useCallback(() => {
    setRatingSheetVisible(false);
  }, []);

  // 로그인 다이얼로그 닫기
  const handleCloseDialog = useCallback(() => {
    setLoginDialogVisible(false);
    setPendingAction(null);
  }, []);

  // 로그인 성공 시 실행할 콜백 (pending 액션에 따라 결정)
  const loginSuccessCallback = useMemo(() => {
    if (pendingAction === 'favorite') {
      return () => {
        toggleFavorite({ contentId, contentType, nickname: displayName, videoTitle: contentTitle });
        setPendingAction(null);
      };
    }
    if (pendingAction === 'rating') {
      return () => {
        setRatingSheetVisible(true);
        setPendingAction(null);
      };
    }
    return undefined;
  }, [pendingAction, contentId, contentType, toggleFavorite]);

  return {
    isFavorited,
    hasRating,
    currentRating,
    isLoginDialogVisible,
    isRatingSheetVisible,
    handleFavoritePress,
    handleRatingPress,
    handleSubmitRating,
    handleCloseRatingSheet,
    handleCloseDialog,
    loginSuccessCallback,
  };
}
