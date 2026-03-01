/**
 * SortSelector - 정렬 선택 컴포넌트
 *
 * 정렬 옵션을 드롭다운 형태로 선택할 수 있는 컴포넌트입니다.
 * 터치 시 바텀시트가 열리고, 옵션을 선택하면 정렬이 변경됩니다.
 *
 * @example
 * <SortSelector
 *   sortType="latest"
 *   onSortChange={handleSortChange}
 * />
 */

import React, { useCallback, useState } from 'react';
import { TouchableOpacity, Modal, Pressable } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import DownArrowIcon from '@assets/icons/chevron_down.svg';
import type { ChannelSortType } from '../_types';

interface SortSelectorProps {
  /** 현재 정렬 타입 */
  readonly sortType: ChannelSortType;
  /** 정렬 변경 콜백 */
  readonly onSortChange: (sortType: ChannelSortType) => void;
}

const SORT_OPTIONS: { value: ChannelSortType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

function SortSelector({ sortType, onSortChange }: SortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortType)?.label ?? '전체';

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (value: ChannelSortType) => {
      onSortChange(value);
      setIsOpen(false);
    },
    [onSortChange],
  );

  return (
    <>
      <SortButton onPress={handleOpen} activeOpacity={0.7}>
        <SortButtonText>{currentLabel}</SortButtonText>
        <DownArrowIcon width={16} height={16} color={colors.gray02} />
      </SortButton>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
        <ModalOverlay onPress={handleClose}>
          <Pressable>
            <OptionsContainer>
              {SORT_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  isSelected={sortType === option.value}
                >
                  <OptionText isSelected={sortType === option.value}>{option.label}</OptionText>
                </OptionButton>
              ))}
            </OptionsContainer>
          </Pressable>
        </ModalOverlay>
      </Modal>
    </>
  );
}

/* Styled Components */
const SortButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
});

const SortButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.gray01,
});

const ModalOverlay = styled(Pressable)({
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-start',
  alignItems: 'flex-end',
  paddingTop: 140,
  paddingRight: 16,
});

const OptionsContainer = styled.View({
  backgroundColor: colors.gray05,
  borderRadius: 12,
  paddingVertical: 8,
  minWidth: 160,
});

const OptionButton = styled(TouchableOpacity)<{ isSelected: boolean }>(({ isSelected }) => ({
  paddingHorizontal: 20,
  paddingVertical: 14,
  backgroundColor: isSelected ? colors.gray04 : 'transparent',
}));

const OptionText = styled.Text<{ isSelected: boolean }>(({ isSelected }) => ({
  ...textStyles.body2,
  color: isSelected ? colors.white : colors.gray02,
}));

export { SortSelector };
