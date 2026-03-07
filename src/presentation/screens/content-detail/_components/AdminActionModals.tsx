/**
 * AdminActionModals - 어드민 전용 액션 모달 묶음
 *
 * 콘텐츠 상세 화면에서 어드민이 사용하는 모든 모달을 묶어서 관리합니다.
 * - AdminActionBottomSheet: 어드민 액션 선택
 * - BackdropSelectionModal: 메인 이미지 선택
 * - VideoStatusModal: 비디오 상태 변경
 * - IncludesEndingModal: 결말 포함 여부 변경
 */

import { AdminContentAction } from '@/features/admin';
import {
  AdminActionBottomSheet,
  BackdropSelectionModal,
  VideoStatusModal,
  IncludesEndingModal,
} from '@/presentation/admin/components';
import type { UseAdminContentActionsReturn } from '@/presentation/admin/hooks/useAdminContentActions';

interface AdminActionModalsProps {
  /** useAdminContentActions 훅의 반환값 전체 */
  readonly adminAction: UseAdminContentActionsReturn;
}

function AdminActionModals({ adminAction }: AdminActionModalsProps) {
  const {
    isActionSheetVisible,
    selectedAction,
    actions,
    contentId,
    contentType,
    currentVideoId,
    currentVideoTitle,
    currentVideoStatus,
    currentIncludesEnding,
    currentBackdropPath,
    isSaving,
    handleSelectAction,
    handleCloseActionSheet,
    handleCloseActionModal,
    handleBackdropSelect,
    handleVideoStatusChange,
    handleIncludesEndingChange,
  } = adminAction;

  return (
    <>
      {/* 어드민 액션 바텀시트 */}
      <AdminActionBottomSheet
        visible={isActionSheetVisible}
        actions={[...actions]}
        onSelectAction={handleSelectAction}
        onClose={handleCloseActionSheet}
        contentId={contentId}
        contentType={contentType}
        videoId={currentVideoId}
        currentVideoStatus={currentVideoStatus}
      />

      {/* 메인 이미지(Backdrop) 선택 모달 */}
      <BackdropSelectionModal
        visible={selectedAction === AdminContentAction.CHANGE_BACKDROP}
        contentId={contentId}
        contentType={contentType}
        currentBackdropPath={currentBackdropPath}
        onSelect={handleBackdropSelect}
        onClose={handleCloseActionModal}
        isSaving={isSaving}
      />

      {/* 비디오 상태 변경 모달 */}
      {currentVideoId && currentVideoTitle && (
        <VideoStatusModal
          visible={selectedAction === AdminContentAction.CHANGE_VIDEO_STATUS}
          videoId={currentVideoId}
          videoTitle={currentVideoTitle}
          currentStatus={currentVideoStatus}
          onChangeStatus={handleVideoStatusChange}
          onClose={handleCloseActionModal}
          isSaving={isSaving}
        />
      )}

      {/* 결말포함 여부 변경 모달 */}
      {currentVideoId && currentVideoTitle && (
        <IncludesEndingModal
          visible={selectedAction === AdminContentAction.CHANGE_INCLUDES_ENDING}
          videoId={currentVideoId}
          videoTitle={currentVideoTitle}
          currentIncludesEnding={currentIncludesEnding ?? false}
          onChangeIncludesEnding={handleIncludesEndingChange}
          onClose={handleCloseActionModal}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

export { AdminActionModals };
export type { AdminActionModalsProps };
