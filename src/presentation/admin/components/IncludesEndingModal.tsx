/**
 * IncludesEndingModal - 결말포함 여부 변경 모달
 *
 * 어드민이 비디오의 결말포함 여부를 변경할 수 있는 모달
 */

import React, { useCallback, useState } from 'react';
import { Modal, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

interface IncludesEndingModalProps {
  /** 모달 표시 여부 */
  readonly visible: boolean;
  /** 비디오 ID */
  readonly videoId: string;
  /** 비디오 제목 */
  readonly videoTitle: string;
  /** 현재 결말포함 여부 */
  readonly currentIncludesEnding: boolean;
  /** 변경 콜백 */
  readonly onChangeIncludesEnding: (includesEnding: boolean) => Promise<void>;
  /** 닫기 콜백 */
  readonly onClose: () => void;
  /** 저장 중 여부 */
  readonly isSaving?: boolean;
}

/** 결말포함 옵션 목록 */
const INCLUDES_ENDING_OPTIONS: { value: boolean; label: string; description: string }[] = [
  {
    value: true,
    label: 'ON',
    description: '이 영상에 결말이 포함되어 있습니다',
  },
  {
    value: false,
    label: 'OFF',
    description: '이 영상에 결말이 포함되어 있지 않습니다',
  },
];

function IncludesEndingModal({
  visible,
  videoId,
  videoTitle,
  currentIncludesEnding,
  onChangeIncludesEnding,
  onClose,
  isSaving = false,
}: IncludesEndingModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedValue, setSelectedValue] = useState<boolean | null>(null);

  // 옵션 선택 핸들러
  const handleOptionSelect = useCallback((value: boolean) => {
    setSelectedValue(value);
  }, []);

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(() => {
    if (selectedValue === null) return;
    onChangeIncludesEnding(selectedValue);
  }, [selectedValue, onChangeIncludesEnding]);

  // 모달 닫기 시 선택 초기화
  const handleClose = useCallback(() => {
    setSelectedValue(null);
    onClose();
  }, [onClose]);

  // 선택 가능 여부
  const canConfirm = selectedValue !== null && selectedValue !== currentIncludesEnding;

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
            <HeaderTitle>결말포함 여부 변경</HeaderTitle>
          </HeaderRow>
          <VideoTitleText numberOfLines={1}>{videoTitle}</VideoTitleText>
          <VideoIdText>ID: {videoId}</VideoIdText>
        </HeaderContainer>

        {/* 옵션 목록 */}
        <OptionsContainer>
          {INCLUDES_ENDING_OPTIONS.map((option) => {
            const isSelected = selectedValue !== null
              ? selectedValue === option.value
              : currentIncludesEnding === option.value;
            const isCurrent = currentIncludesEnding === option.value;

            return (
              <OptionButton
                key={option.label}
                onPress={() => handleOptionSelect(option.value)}
                activeOpacity={0.7}
                disabled={isSaving}
                isSelected={isSelected}
              >
                <OptionContent>
                  <OptionLabelRow>
                    <OptionLabel isOn={option.value}>{option.label}</OptionLabel>
                    {isCurrent && selectedValue === null && (
                      <CurrentBadge>
                        <CurrentBadgeText>현재</CurrentBadgeText>
                      </CurrentBadge>
                    )}
                  </OptionLabelRow>
                  <OptionDescription>{option.description}</OptionDescription>
                </OptionContent>
                <RadioButton isSelected={isSelected}>
                  {isSelected && <RadioButtonInner />}
                </RadioButton>
              </OptionButton>
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

interface OptionButtonProps {
  isSelected: boolean;
}

const OptionButton = styled.TouchableOpacity<OptionButtonProps>(({ isSelected }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : colors.gray05,
  borderRadius: 12,
  borderWidth: isSelected ? 2 : 0,
  borderColor: colors.primary,
  paddingHorizontal: 16,
  paddingVertical: 14,
}));

const OptionContent = styled.View({
  flex: 1,
  marginRight: 12,
});

const OptionLabelRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
});

const OptionLabel = styled.Text<{ isOn: boolean }>(({ isOn }) => ({
  ...textStyles.title2,
  color: isOn ? colors.green : colors.white,
}));

const OptionDescription = styled.Text({
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
}

const RadioButton = styled.View<RadioButtonProps>(({ isSelected }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: isSelected ? colors.primary : colors.gray03,
  justifyContent: 'center',
  alignItems: 'center',
}));

const RadioButtonInner = styled.View({
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.primary,
});

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

export { IncludesEndingModal };
