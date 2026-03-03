/**
 * useAdminContentActions
 *
 * 콘텐츠 상세 페이지에서 어드민 전용 액션을 관리하는 훅
 */

import { useCallback, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useDialog } from '@/presentation/components/dialog';
import { AdminLogger } from '@/shared/utils/logger';
import {
  AdminContentAction,
  ADMIN_CONTENT_ACTIONS,
  type AdminActionConfig,
} from '@/features/admin/types';
import { adminContentApi } from '@/features/admin/api/adminContentApi';
import type { ContentType } from '@/shared/types/content/contentType.enum';
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
        includesEnding: boolean;
      }
    | undefined;
}

interface UseAdminContentActionsReturn {
  /** 어드민 여부 */
  readonly isAdmin: boolean;
  /** 어드민 액션 목록 (isAdmin이 false면 빈 배열, 조건에 따라 disabled 상태 포함) */
  readonly actions: AdminActionConfig[];
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
  /** 현재 결말포함 여부 */
  readonly currentIncludesEnding: boolean;
  /** 결말포함 여부 변경 핸들러 */
  readonly handleIncludesEndingChange: (includesEnding: boolean) => Promise<void>;
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
  const { showDialog } = useDialog();
  const queryClient = useQueryClient();
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminContentAction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 비디오 개수 조회 (어드민인 경우에만)
  const { data: videoCount = 0 } = useQuery({
    queryKey: ['videoCount', contentId, contentType],
    queryFn: () => adminContentApi.getContentVideoCount(contentId, contentType),
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 액션 목록 생성 (비디오 개수에 따라 disabled 처리, 결말포함 상태 표시)
  const actions: AdminActionConfig[] = useMemo(() => {
    return ADMIN_CONTENT_ACTIONS.map((action) => {
      if (action.action === AdminContentAction.CHANGE_PRIMARY_VIDEO) {
        const isDisabled = videoCount <= 1;
        return {
          ...action,
          disabled: isDisabled,
          disabledReason: isDisabled ? '비디오가 1개뿐입니다' : undefined,
        };
      }
      if (action.action === AdminContentAction.CHANGE_INCLUDES_ENDING) {
        const currentState = currentVideo?.includesEnding ? 'ON' : 'OFF';
        return {
          ...action,
          label: `결말포함 여부 변경 (${currentState})`,
        };
      }
      return action;
    });
  }, [videoCount, currentVideo?.includesEnding]);

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

        // 비디오 상태를 승인(confirmed)으로 자동 변경
        if (currentVideo?.id) {
          await adminContentApi.updateVideoStatus(currentVideo.id, 'confirmed');
        }

        // 캐시 무효화하여 UI 업데이트
        await queryClient.invalidateQueries({
          queryKey: ['contentDetail', contentId, contentType],
        });
        await queryClient.invalidateQueries({
          queryKey: ['videos', contentId, contentType],
        });

        await showDialog({
          title: '완료',
          description: '메인 이미지를 변경했어요',
          buttonText: '확인',
        });
        setSelectedAction(null);
      } catch (error) {
        AdminLogger.error('Backdrop 변경 실패:', error);
        await showDialog({
          title: '오류',
          description: '이미지를 변경하지 못했어요. 다시 시도해주세요.',
          buttonText: '확인',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [contentId, contentType, currentVideo?.id, queryClient, showDialog],
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

        await showDialog({
          title: '완료',
          description: '비디오 상태를 변경했어요',
          buttonText: '확인',
        });
        setSelectedAction(null);
      } catch (error) {
        AdminLogger.error('비디오 상태 변경 실패:', error);
        await showDialog({
          title: '오류',
          description: '상태를 변경하지 못했어요. 다시 시도해주세요.',
          buttonText: '확인',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [currentVideo?.id, contentId, contentType, queryClient, showDialog],
  );

  // 결말포함 여부 변경 핸들러
  const handleIncludesEndingChange = useCallback(
    async (includesEnding: boolean) => {
      if (!currentVideo?.id) return;

      try {
        setIsSaving(true);
        await adminContentApi.updateIncludesEnding(currentVideo.id, includesEnding);

        // 결말포함 off 시 비디오 상태를 승인(confirmed)으로 자동 변경
        if (!includesEnding) {
          await adminContentApi.updateVideoStatus(currentVideo.id, 'confirmed');
        }

        // 비디오 목록 캐시 무효화하여 UI 업데이트
        await queryClient.invalidateQueries({
          queryKey: ['videos', contentId, contentType],
        });

        const statusText = includesEnding ? 'ON' : 'OFF';
        await showDialog({
          title: '완료',
          description: `결말 포함을 ${statusText}으로 변경했어요`,
          buttonText: '확인',
        });
        setSelectedAction(null);
      } catch (error) {
        AdminLogger.error('결말포함 여부 변경 실패:', error);
        await showDialog({
          title: '오류',
          description: '변경하지 못했어요. 다시 시도해주세요.',
          buttonText: '확인',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [currentVideo?.id, contentId, contentType, queryClient, showDialog],
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
      currentIncludesEnding: false,
      handleIncludesEndingChange: async () => {},
    };
  }

  return {
    isAdmin: true,
    actions,
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
    currentIncludesEnding: currentVideo?.includesEnding ?? false,
    handleIncludesEndingChange,
  };
}
