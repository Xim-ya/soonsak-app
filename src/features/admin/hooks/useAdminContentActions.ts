/**
 * useAdminContentActions
 *
 * 콘텐츠 상세 페이지에서 어드민 전용 액션을 관리하는 훅
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useAuth } from '@/shared/providers/AuthProvider';
import { AdminContentAction, ADMIN_CONTENT_ACTIONS } from '../types';
import { adminContentApi } from '../api';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { ContentStatus } from '@/features/content/types';

interface UseAdminContentActionsParams {
  contentId: number;
  contentType: ContentType;
  /** 현재 backdrop 경로 (모달에서 현재 선택된 것 표시용) */
  currentBackdropPath: string | undefined;
  /** 현재 비디오 정보 (비디오 상태 변경용) */
  currentVideo:
    | {
        id: string;
        title: string;
        status: ContentStatus | undefined;
      }
    | undefined;
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
  /** 콘텐츠 ID (모달에서 사용) */
  readonly contentId: number;
  /** 콘텐츠 타입 (모달에서 사용) */
  readonly contentType: ContentType;
  /** 현재 backdrop 경로 */
  readonly currentBackdropPath: string | undefined;
  /** backdrop 선택 완료 핸들러 */
  readonly handleBackdropSelect: (backdropPath: string) => Promise<void>;
  /** 저장 중 여부 */
  readonly isSaving: boolean;
  /** 현재 비디오 ID */
  readonly currentVideoId: string | undefined;
  /** 현재 비디오 제목 */
  readonly currentVideoTitle: string | undefined;
  /** 현재 비디오 상태 */
  readonly currentVideoStatus: ContentStatus | undefined;
  /** 비디오 상태 변경 핸들러 */
  readonly handleVideoStatusChange: (status: ContentStatus) => Promise<void>;
}

/**
 * 어드민 콘텐츠 액션 훅
 *
 * @example
 * const adminActions = useAdminContentActions({ contentId, contentType, currentBackdropPath });
 *
 * // 어드민이 아니면 handleMorePress가 undefined
 * <AnimatedAppBar onMorePress={adminActions.handleMorePress ?? favoriteAction.handleMorePress} />
 */
export function useAdminContentActions({
  contentId,
  contentType,
  currentBackdropPath,
  currentVideo,
}: UseAdminContentActionsParams): UseAdminContentActionsReturn {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminContentAction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
  }, []);

  // 액션 모달 닫기
  const handleCloseActionModal = useCallback(() => {
    setSelectedAction(null);
  }, []);

  // Backdrop 선택 완료 핸들러
  const handleBackdropSelect = useCallback(
    async (backdropPath: string) => {
      try {
        setIsSaving(true);
        await adminContentApi.updateBackdropPath(contentId, contentType, backdropPath);

        // 캐시 무효화하여 UI 업데이트
        await queryClient.invalidateQueries({
          queryKey: ['contentDetail', contentId, contentType],
        });

        Alert.alert('완료', '메인 이미지가 변경되었습니다.');
        setSelectedAction(null);
      } catch (error) {
        console.error('Backdrop 변경 실패:', error);
        Alert.alert('오류', '이미지 변경에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
    },
    [contentId, contentType, queryClient],
  );

  // 비디오 상태 변경 핸들러
  const handleVideoStatusChange = useCallback(
    async (status: ContentStatus) => {
      if (!currentVideo?.id) return;

      try {
        setIsSaving(true);
        await adminContentApi.updateVideoStatus(currentVideo.id, status);

        // 비디오 목록 캐시 무효화하여 UI 업데이트
        await queryClient.invalidateQueries({
          queryKey: ['videos', contentId, contentType],
        });

        Alert.alert('완료', '비디오 상태가 변경되었습니다.');
        setSelectedAction(null);
      } catch (error) {
        console.error('비디오 상태 변경 실패:', error);
        Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
    },
    [currentVideo?.id, contentId, contentType, queryClient],
  );

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
      contentId,
      contentType,
      currentBackdropPath: undefined,
      handleBackdropSelect: async () => {},
      isSaving: false,
      currentVideoId: undefined,
      currentVideoTitle: undefined,
      currentVideoStatus: undefined,
      handleVideoStatusChange: async () => {},
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
    contentId,
    contentType,
    currentBackdropPath,
    handleBackdropSelect,
    isSaving,
    currentVideoId: currentVideo?.id,
    currentVideoTitle: currentVideo?.title,
    currentVideoStatus: currentVideo?.status,
    handleVideoStatusChange,
  };
}
