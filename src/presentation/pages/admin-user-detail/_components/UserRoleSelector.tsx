/**
 * UserRoleSelector - 유저 역할 변경 UI
 *
 * 역할 변경 버튼과 선택 모달을 제공합니다.
 */

import { memo, useCallback, useState } from 'react';
import { TouchableOpacity, Modal, Pressable, View, ActivityIndicator, Alert } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { UserRoleLabel, getRoleColor } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

// 체크 아이콘 SVG
const checkIconSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6L9 17L4 12" stroke="${colors.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 편집 아이콘 SVG
const editIconSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserRoleSelectorProps {
  readonly currentRole: UserRole;
  readonly isLoading: boolean;
  readonly onRoleChange: (newRole: UserRole) => void;
}

const ROLE_OPTIONS: UserRole[] = ['user', 'admin', 'banned'];

export const UserRoleSelector = memo(function UserRoleSelector({
  currentRole,
  isLoading,
  onRoleChange,
}: UserRoleSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSelect = useCallback(
    (role: UserRole) => {
      if (role === currentRole) {
        setIsModalVisible(false);
        return;
      }

      // 차단 역할로 변경 시 확인
      if (role === 'banned') {
        Alert.alert(
          '차단 확인',
          '이 유저를 차단하시겠습니까?\n차단된 유저는 앱을 이용할 수 없습니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '차단',
              style: 'destructive',
              onPress: () => {
                setIsModalVisible(false);
                onRoleChange(role);
              },
            },
          ],
        );
        return;
      }

      // 관리자 역할로 변경 시 확인
      if (role === 'admin') {
        Alert.alert('관리자 권한 부여', '이 유저에게 관리자 권한을 부여하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          {
            text: '확인',
            onPress: () => {
              setIsModalVisible(false);
              onRoleChange(role);
            },
          },
        ]);
        return;
      }

      // 일반 유저로 변경
      setIsModalVisible(false);
      onRoleChange(role);
    },
    [currentRole, onRoleChange],
  );

  return (
    <>
      <Container>
        <SectionTitle>역할 관리</SectionTitle>
        <RoleButton onPress={handleOpenModal} activeOpacity={0.7} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <RoleButtonText>역할 변경</RoleButtonText>
              <SvgXml xml={editIconSvg} width={20} height={20} />
            </>
          )}
        </RoleButton>
      </Container>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <ModalOverlay onPress={handleCloseModal}>
          <ModalContent onPress={(e) => e.stopPropagation()}>
            <ModalTitle>역할 선택</ModalTitle>
            {ROLE_OPTIONS.map((roleOption) => (
              <RoleOption
                key={roleOption}
                onPress={() => handleSelect(roleOption)}
                activeOpacity={0.7}
              >
                <RoleOptionLabel isSelected={currentRole === roleOption} userRole={roleOption}>
                  {UserRoleLabel[roleOption]}
                </RoleOptionLabel>
                {currentRole === roleOption && <SvgXml xml={checkIconSvg} width={20} height={20} />}
              </RoleOption>
            ))}
            <CancelButton onPress={handleCloseModal} activeOpacity={0.7}>
              <CancelButtonText>취소</CancelButtonText>
            </CancelButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
});

/* Styled Components */
const Container = styled(View)({
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.black,
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
});

const SectionTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  marginBottom: 12,
});

const RoleButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.gray06,
  paddingVertical: 14,
  borderRadius: 10,
  gap: 8,
});

const RoleButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
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
  padding: 20,
  minWidth: 280,
});

const ModalTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 16,
  textAlign: 'center',
});

const RoleOption = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 16,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

interface RoleOptionLabelProps {
  isSelected: boolean;
  userRole: UserRole;
}

const RoleOptionLabel = styled.Text<RoleOptionLabelProps>(({ isSelected, userRole }) => ({
  ...textStyles.body1,
  color: isSelected ? getRoleColor(userRole, { defaultColor: colors.white }) : colors.white,
  fontWeight: isSelected ? '600' : '400',
}));

const CancelButton = styled(TouchableOpacity)({
  marginTop: 16,
  paddingVertical: 14,
  alignItems: 'center',
});

const CancelButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
});
