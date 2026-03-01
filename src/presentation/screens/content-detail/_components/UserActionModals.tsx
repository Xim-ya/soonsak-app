/**
 * UserActionModals - 일반 사용자 액션 모달 묶음
 *
 * 콘텐츠 상세 화면에서 일반 사용자가 사용하는 모든 모달을 묶어서 관리합니다.
 * - FavoriteActionBottomSheet: 찜하기 액션 시트
 * - LoginPromptDialog: 로그인 유도 다이얼로그
 */

import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { FavoriteActionBottomSheet } from '@/presentation/components/bottom-sheet/FavoriteActionBottomSheet';

interface UserActionModalsProps {
  /** 찜 여부 */
  readonly isFavorited: boolean;
  /** 토글 중 여부 */
  readonly isToggling: boolean;
  /** 로그인 다이얼로그 표시 여부 */
  readonly isLoginDialogVisible: boolean;
  /** 액션 시트 표시 여부 */
  readonly isActionSheetVisible: boolean;
  /** 찜하기 토글 핸들러 */
  readonly onToggleFavorite: () => void;
  /** 액션 시트 닫기 핸들러 */
  readonly onCloseActionSheet: () => void;
  /** 로그인 다이얼로그 닫기 핸들러 */
  readonly onCloseDialog: () => void;
}

function UserActionModals({
  isFavorited,
  isToggling,
  isLoginDialogVisible,
  isActionSheetVisible,
  onToggleFavorite,
  onCloseActionSheet,
  onCloseDialog,
}: UserActionModalsProps) {
  return (
    <>
      {/* 찜하기 액션 바텀시트 (일반 사용자용) */}
      <FavoriteActionBottomSheet
        visible={isActionSheetVisible}
        isFavorited={isFavorited}
        disabled={isToggling}
        onToggleFavorite={onToggleFavorite}
        onClose={onCloseActionSheet}
      />

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog visible={isLoginDialogVisible} onClose={onCloseDialog} />
    </>
  );
}

export { UserActionModals };
export type { UserActionModalsProps };
