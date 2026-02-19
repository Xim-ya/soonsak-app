/**
 * useAdminContentActions
 *
 * 콘텐츠 상세 페이지에서 어드민 전용 액션을 관리하는 훅
 */

import { useCallback, useState } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';
import { AdminContentAction, ADMIN_CONTENT_ACTIONS } from '../types';
import type { ContentType } from '@/presentation/types/content/contentType.enum';

interface UseAdminContentActionsParams {
  contentId: number;
  contentType: ContentType;
}

interface UseAdminContentActionsReturn {
  /** 어드민 여부 */
  readonly isAdmin: boolean;
  /** 어드민 액션 목록 (isAdmin이 false면 빈 배열) */
  readonly actions: typeof ADMIN_CONTENT_ACTIONS;
  /** 바텀시트 표시 여부 */
  readonly isActionSheetVisible: boolean;
  /** 더보기 버튼 클릭 핸들러 (isAdmin이 false면 undefined) */
  readonly handleMorePress: (() => void) | undefined;
  /** 바텀시트 닫기 */
  readonly handleCloseActionSheet: () => void;
  /** 액션 선택 핸들러 */
  readonly handleSelectAction: (action: AdminContentAction) => void;
  /** 현재 선택된 액션 (모달 표시용) */
  readonly selectedAction: AdminContentAction | null;
  /** 선택된 액션 모달 닫기 */
  readonly handleCloseActionModal: () => void;
}

/**
 * 어드민 콘텐츠 액션 훅
 *
 * @example
 * const adminActions = useAdminContentActions({ contentId, contentType });
 *
 * // 어드민이 아니면 handleMorePress가 undefined
 * <AnimatedAppBar onMorePress={adminActions.handleMorePress ?? favoriteAction.handleMorePress} />
 */
export function useAdminContentActions({
  contentId: _contentId,
  contentType: _contentType,
}: UseAdminContentActionsParams): UseAdminContentActionsReturn {
  // TODO: contentId, contentType은 액션 실행 시 사용 예정
  void _contentId;
  void _contentType;
  const { isAdmin } = useAuth();
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminContentAction | null>(null);

  // 더보기 버튼 클릭
  const handleMorePress = useCallback(() => {
    setActionSheetVisible(true);
  }, []);

  // 바텀시트 닫기
  const handleCloseActionSheet = useCallback(() => {
    setActionSheetVisible(false);
  }, []);

  // 액션 선택
  const handleSelectAction = useCallback((action: AdminContentAction) => {
    setActionSheetVisible(false);
    setSelectedAction(action);

    // TODO: 각 액션별 처리
    // switch (action) {
    //   case AdminContentAction.CHANGE_BACKDROP:
    //     // 이미지 선택 모달 표시
    //     break;
    //   case AdminContentAction.CHANGE_CONTENT_TYPE:
    //     // 타입 선택 모달 표시
    //     break;
    // }
  }, []);

  // 액션 모달 닫기
  const handleCloseActionModal = useCallback(() => {
    setSelectedAction(null);
  }, []);

  // 어드민이 아니면 빈 상태 반환 (일관된 인터페이스)
  if (!isAdmin) {
    return {
      isAdmin: false,
      actions: [],
      isActionSheetVisible: false,
      handleMorePress: undefined,
      handleCloseActionSheet: () => {},
      handleSelectAction: () => {},
      selectedAction: null,
      handleCloseActionModal: () => {},
    };
  }

  return {
    isAdmin: true,
    actions: ADMIN_CONTENT_ACTIONS,
    isActionSheetVisible,
    handleMorePress,
    handleCloseActionSheet,
    handleSelectAction,
    selectedAction,
    handleCloseActionModal,
  };
}
