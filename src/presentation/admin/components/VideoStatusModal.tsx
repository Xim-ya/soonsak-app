/**
 * VideoStatusModal - 비디오 상태 변경 모달
 *
 * 어드민이 비디오의 상태를 변경할 수 있는 모달
 * rejected 선택 시 경고 메시지 표시
 */

import React, { useCallback, useState } from 'react';
import { Modal, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDialog } from '@/presentation/components/dialog';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { ContentStatus, ContentStatusLabel } from '@/features/content/types';

interface VideoStatusModalProps {
  /** 모달 표시 여부 */
  readonly visible: boolean;
  /** 비디오 ID */
  readonly videoId: string;
  /** 비디오 제목 */
  readonly videoTitle: string;
  /** 현재 상태 */
  readonly currentStatus: ContentStatus | undefined;
  /** 상태 변경 콜백 */
  readonly onChangeStatus: (status: ContentStatus) => Promise<void>;
  /** 닫기 콜백 */
  readonly onClose: () => void;
  /** 저장 중 여부 */
  readonly isSaving?: boolean;
}

/** 상태 옵션 목록 */
const STATUS_OPTIONS: { status: ContentStatus; description: string; isDestructive?: boolean }[] = [
  {
    status: ContentStatus.PENDING,
    description: '검토 대기 상태',
  },
  {
    status: ContentStatus.CONFIRMED,
    description: '승인 완료, 정상 노출',
  },
  {
    status: ContentStatus.NEEDS_REVIEW,
    description: '검토가 필요한 상태 (신고 등)',
  },
  {
    status: ContentStatus.REJECTED,
    description: '거부됨 - 대표 영상 해제, 유일한 영상이면 콘텐츠 삭제',
    isDestructive: true,
  },
];

function VideoStatusModal({
  visible,
  videoId,
  videoTitle,
  currentStatus,
  onChangeStatus,
  onClose,
  isSaving = false,
}: VideoStatusModalProps) {
  const insets = useSafeAreaInsets();
  const { showConfirmDialog } = useDialog();
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | null>(null);

  // 상태 선택 핸들러
  const handleStatusSelect = useCallback((status: ContentStatus) => {
    setSelectedStatus(status);
  }, []);

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(async () => {
    if (!selectedStatus) return;

    // rejected 선택 시 경고
    if (selectedStatus === ContentStatus.REJECTED) {
      const result = await showConfirmDialog({
        title: '비디오 거부',
        description:
          '비디오를 거부하면:\n• 대표 영상에서 해제됩니다\n• 이 비디오가 유일하면 콘텐츠가 삭제됩니다\n\n계속하시겠습니까?',
        leftButtonText: '취소',
        rightButtonText: '거부',
      });
      if (result === 'right') {
        onChangeStatus(selectedStatus);
      }
    } else {
      onChangeStatus(selectedStatus);
    }
  }, [selectedStatus, onChangeStatus, showConfirmDialog]);

  // 모달 닫기 시 선택 초기화
  const handleClose = useCallback(() => {
    setSelectedStatus(null);
    onClose();
  }, [onClose]);

  // 선택 가능 여부
  const canConfirm = selectedStatus && selectedStatus !== currentStatus;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Overlay />
      </TouchableWithoutFeedback>

      <ModalContainer paddingBottom={insets.bottom}>
        {/* 헤더 */}
        <HeaderContainer>
          <HandleBar />
          <HeaderRow>
            <AdminBadge>
              <AdminBadgeText>관리자</AdminBadgeText>
            </AdminBadge>
            <HeaderTitle>비디오 상태 변경</HeaderTitle>
          </HeaderRow>
          <VideoTitleText numberOfLines={1}>{videoTitle}</VideoTitleText>
          <VideoIdText>ID: {videoId}</VideoIdText>
        </HeaderContainer>

        {/* 상태 옵션 목록 */}
        <OptionsContainer>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus
              ? selectedStatus === option.status
              : currentStatus === option.status;
            const isCurrent = currentStatus === option.status;

            return (
              <StatusOption
                key={option.status}
                onPress={() => handleStatusSelect(option.status)}
                activeOpacity={0.7}
                disabled={isSaving}
                isSelected={isSelected}
                isDestructive={option.isDestructive ?? false}
              >
                <StatusOptionContent>
                  <StatusLabelRow>
                    <StatusLabel isDestructive={option.isDestructive ?? false}>
                      {ContentStatusLabel[option.status]}
                    </StatusLabel>
                    {isCurrent && !selectedStatus && (
                      <CurrentBadge>
                        <CurrentBadgeText>현재</CurrentBadgeText>
                      </CurrentBadge>
                    )}
                  </StatusLabelRow>
                  <StatusDescription>{option.description}</StatusDescription>
                </StatusOptionContent>
                <RadioButton isSelected={isSelected} isDestructive={option.isDestructive ?? false}>
                  {isSelected && <RadioButtonInner isDestructive={option.isDestructive ?? false} />}
                </RadioButton>
              </StatusOption>
            );
          })}
        </OptionsContainer>

        {/* 하단 버튼 */}
        <ButtonContainer>
          <CancelButton onPress={handleClose} activeOpacity={0.7} disabled={isSaving}>
            <CancelButtonText>취소</CancelButtonText>
          </CancelButton>
          <ConfirmButton
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={!canConfirm || isSaving}
            isDisabled={!canConfirm || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <ConfirmButtonText>변경하기</ConfirmButtonText>
            )}
          </ConfirmButton>
        </ButtonContainer>
      </ModalContainer>
    </Modal>
  );
}

/* Styled Components */

const Overlay = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.overlay,
});

const ModalContainer = styled.View<{ paddingBottom: number }>(({ paddingBottom }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.gray06,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: Math.max(paddingBottom, 16),
}));

const HeaderContainer = styled.View({
  alignItems: 'center',
  paddingTop: 12,
  paddingBottom: 16,
  paddingHorizontal: 16,
});

const HandleBar = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
  marginBottom: 16,
});

const HeaderRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
});

const AdminBadge = styled.View({
  backgroundColor: colors.primary,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 4,
});

const AdminBadgeText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontWeight: '600',
});

const HeaderTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const VideoTitleText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  marginBottom: 4,
});

const VideoIdText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const OptionsContainer = styled.View({
  paddingHorizontal: 16,
  gap: 8,
});

interface StatusOptionProps {
  isSelected: boolean;
  isDestructive: boolean;
}

const StatusOption = styled.TouchableOpacity<StatusOptionProps>(
  ({ isSelected, isDestructive }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isSelected
      ? isDestructive
        ? 'rgba(255, 72, 78, 0.15)'
        : 'rgba(139, 92, 246, 0.15)'
      : colors.gray05,
    borderRadius: 12,
    borderWidth: isSelected ? 2 : 0,
    borderColor: isDestructive ? colors.red : colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  }),
);

const StatusOptionContent = styled.View({
  flex: 1,
  marginRight: 12,
});

const StatusLabelRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
});

const StatusLabel = styled.Text<{ isDestructive: boolean }>(({ isDestructive }) => ({
  ...textStyles.title2,
  color: isDestructive ? colors.red : colors.white,
}));

const StatusDescription = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
});

const CurrentBadge = styled.View({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const CurrentBadgeText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

interface RadioButtonProps {
  isSelected: boolean;
  isDestructive: boolean;
}

const RadioButton = styled.View<RadioButtonProps>(({ isSelected, isDestructive }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: isSelected ? (isDestructive ? colors.red : colors.primary) : colors.gray03,
  justifyContent: 'center',
  alignItems: 'center',
}));

const RadioButtonInner = styled.View<{ isDestructive: boolean }>(({ isDestructive }) => ({
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: isDestructive ? colors.red : colors.primary,
}));

const ButtonContainer = styled.View({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingTop: 16,
  gap: 12,
});

const CancelButton = styled.TouchableOpacity({
  flex: 1,
  height: 48,
  backgroundColor: colors.gray05,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
});

const CancelButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const ConfirmButton = styled.TouchableOpacity<{ isDisabled: boolean }>(({ isDisabled }) => ({
  flex: 1,
  height: 48,
  backgroundColor: isDisabled ? colors.gray04 : colors.primary,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
}));

const ConfirmButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

export { VideoStatusModal };
