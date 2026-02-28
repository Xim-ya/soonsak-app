/**
 * SortSelector - 정렬 선택 드롭다운 컴포넌트
 *
 * 정렬 옵션을 드롭다운 형태로 선택할 수 있는 공통 컴포넌트입니다.
 * 터치 시 버튼 바로 아래에 드롭다운 메뉴가 열립니다.
 *
 * @example
 * // 기본 사용 (DEFAULT_SORT_OPTIONS 사용)
 * <SortSelector
 *   sortType="latest"
 *   onSortChange={handleSortChange}
 * />
 *
 * @example
 * // 커스텀 옵션 사용
 * <SortSelector
 *   sortType="latest"
 *   onSortChange={handleSortChange}
 *   options={[
 *     { value: 'latest', label: '최신순' },
 *     { value: 'popular', label: '인기순' },
 *   ]}
 * />
 */

import React, { useCallback, useState, useRef } from 'react';
import { TouchableOpacity, Modal, Pressable, View } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import DownArrowIcon from '@assets/icons/chevron_down.svg';
import type { SortType, SortOption } from '@/shared/types/sort';
import { DEFAULT_SORT_OPTIONS } from '@/shared/types/sort';

/** 버튼과 드롭다운 사이 간격 */
const DROPDOWN_GAP = 8;

interface SortSelectorProps<T extends string = SortType> {
  /** 현재 정렬 타입 */
  readonly sortType: T;
  /** 정렬 변경 콜백 */
  readonly onSortChange: (sortType: T) => void;
  /** 정렬 옵션 목록 (기본값: DEFAULT_SORT_OPTIONS) */
  readonly options?: SortOption<T>[];
}

interface ButtonPosition {
  top: number;
  right: number;
}

function SortSelectorComponent<T extends string = SortType>({
  sortType,
  onSortChange,
  options = DEFAULT_SORT_OPTIONS as SortOption<T>[],
}: SortSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>({ top: 0, right: 0 });
  const buttonRef = useRef<View>(null);

  const currentLabel = options.find((opt) => opt.value === sortType)?.label ?? '전체';

  const handleOpen = useCallback(() => {
    // 버튼 위치 측정 후 드롭다운 열기
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonPosition({
        top: y + height + DROPDOWN_GAP,
        right: 16,
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (value: T) => {
      onSortChange(value);
      setIsOpen(false);
    },
    [onSortChange],
  );

  return (
    <>
      <SortButton ref={buttonRef} onPress={handleOpen} activeOpacity={0.7}>
        <SortButtonText>{currentLabel}</SortButtonText>
        <DownArrowIcon width={16} height={16} color={colors.gray02} />
      </SortButton>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
        <ModalOverlay onPress={handleClose}>
          <DropdownContainer style={{ top: buttonPosition.top, right: buttonPosition.right }}>
            <Pressable>
              <OptionsContainer>
                {options.map((option) => (
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
          </DropdownContainer>
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
});

const DropdownContainer = styled.View({
  position: 'absolute',
});

const OptionsContainer = styled.View({
  backgroundColor: colors.gray05,
  borderRadius: 12,
  paddingVertical: 8,
  minWidth: 120,
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

export const SortSelector = SortSelectorComponent;
export type { SortSelectorProps };
