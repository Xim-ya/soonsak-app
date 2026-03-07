/**
 * UserSortSelector - 유저 정렬 선택
 *
 * 정렬 기준을 선택할 수 있는 드롭다운을 제공합니다.
 */

import { memo, useCallback, useState } from 'react';
import { TouchableOpacity, Modal, Pressable } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { type UserSortBy, UserSortByLabel } from '@/features/admin';

// SVG 아이콘 상수 (컴포넌트 외부로 최적화)
const SORT_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 6H21M3 12H15M3 18H9" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const CHECK_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6L9 17L4 12" stroke="${colors.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserSortSelectorProps {
  readonly sortBy: UserSortBy;
  readonly onSortChange: (sort: UserSortBy) => void;
}

const SORT_OPTIONS: UserSortBy[] = ['createdAt', 'lastLoginAt', 'entryCount'];

export const UserSortSelector = memo(function UserSortSelector({
  sortBy,
  onSortChange,
}: UserSortSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSelect = useCallback(
    (sort: UserSortBy) => {
      onSortChange(sort);
      setIsModalVisible(false);
    },
    [onSortChange],
  );

  return (
    <>
      <Container>
        <SortButton onPress={handleOpenModal} activeOpacity={0.7}>
          <SvgXml xml={SORT_ICON_SVG} width={20} height={20} />
          <SortLabel>{UserSortByLabel[sortBy]}</SortLabel>
        </SortButton>
      </Container>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <ModalOverlay onPress={handleCloseModal}>
          <ModalContent onPress={(e) => e.stopPropagation()}>
            <ModalTitle>정렬 기준</ModalTitle>
            {SORT_OPTIONS.map((option) => (
              <SortOption key={option} onPress={() => handleSelect(option)} activeOpacity={0.7}>
                <SortOptionLabel isSelected={sortBy === option}>
                  {UserSortByLabel[option]}
                </SortOptionLabel>
                {sortBy === option && <SvgXml xml={CHECK_ICON_SVG} width={20} height={20} />}
              </SortOption>
            ))}
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
});

/* Styled Components */
const Container = styled.View({
  paddingHorizontal: 16,
  paddingBottom: 8,
  backgroundColor: colors.black,
});

const SortButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 6,
});

const SortLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const ModalOverlay = styled(Pressable)({
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
});

const ModalContent = styled(Pressable)({
  backgroundColor: colors.gray06,
  borderRadius: 16,
  padding: 16,
  minWidth: 240,
});

const ModalTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 16,
  textAlign: 'center',
});

const SortOption = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 14,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

interface SortOptionLabelProps {
  isSelected: boolean;
}

const SortOptionLabel = styled.Text<SortOptionLabelProps>(({ isSelected }) => ({
  ...textStyles.body1,
  color: isSelected ? colors.primary : colors.white,
  fontWeight: isSelected ? '600' : '400',
}));
