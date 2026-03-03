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
import { ContentStatus } from '@/features/content/types';
import { ContentType } from '@/shared/types/content/contentType.enum';

interface AdminActionConfig {
  readonly action: AdminContentAction;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean | undefined;
}

interface AdminActionModalsProps {
  /** 액션 시트 표시 여부 */
  readonly isActionSheetVisible: boolean;
  /** 선택된 액션 */
  readonly selectedAction: AdminContentAction | null;
  /** 사용 가능한 액션 목록 */
  readonly actions: readonly AdminActionConfig[];
  /** 콘텐츠 ID */
  readonly contentId: number;
  /** 콘텐츠 타입 */
  readonly contentType: ContentType;
  /** 현재 비디오 ID */
  readonly currentVideoId: string | undefined;
  /** 현재 비디오 제목 */
  readonly currentVideoTitle: string | undefined;
  /** 현재 비디오 상태 */
  readonly currentVideoStatus: ContentStatus | undefined;
  /** 현재 결말 포함 여부 (undefined면 false로 처리) */
  readonly currentIncludesEnding: boolean | undefined;
  /** 현재 백드롭 경로 */
  readonly currentBackdropPath: string | undefined;
  /** 저장 중 여부 */
  readonly isSaving: boolean;
  /** 액션 선택 핸들러 */
  readonly onSelectAction: (action: AdminContentAction) => void;
  /** 액션 시트 닫기 핸들러 */
  readonly onCloseActionSheet: () => void;
  /** 모달 닫기 핸들러 */
  readonly onCloseActionModal: () => void;
  /** 백드롭 선택 핸들러 */
  readonly onBackdropSelect: (backdropPath: string) => Promise<void>;
  /** 비디오 상태 변경 핸들러 */
  readonly onVideoStatusChange: (status: ContentStatus) => Promise<void>;
  /** 결말 포함 변경 핸들러 */
  readonly onIncludesEndingChange: (includesEnding: boolean) => Promise<void>;
}

function AdminActionModals({
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
  onSelectAction,
  onCloseActionSheet,
  onCloseActionModal,
  onBackdropSelect,
  onVideoStatusChange,
  onIncludesEndingChange,
}: AdminActionModalsProps) {
  return (
    <>
      {/* 어드민 액션 바텀시트 */}
      <AdminActionBottomSheet
        visible={isActionSheetVisible}
        actions={[...actions]}
        onSelectAction={onSelectAction}
        onClose={onCloseActionSheet}
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
        onSelect={onBackdropSelect}
        onClose={onCloseActionModal}
        isSaving={isSaving}
      />

      {/* 비디오 상태 변경 모달 */}
      {currentVideoId && currentVideoTitle && (
        <VideoStatusModal
          visible={selectedAction === AdminContentAction.CHANGE_VIDEO_STATUS}
          videoId={currentVideoId}
          videoTitle={currentVideoTitle}
          currentStatus={currentVideoStatus}
          onChangeStatus={onVideoStatusChange}
          onClose={onCloseActionModal}
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
          onChangeIncludesEnding={onIncludesEndingChange}
          onClose={onCloseActionModal}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

export { AdminActionModals };
export type { AdminActionModalsProps };
