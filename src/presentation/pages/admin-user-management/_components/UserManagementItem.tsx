/**
 * UserManagementItem - 유저 관리 아이템
 *
 * 유저 정보를 표시하고, 탭하면 유저 상세 페이지로 이동
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { UserManagementItem as UserManagementItemType } from '@/features/admin';
import { UserRoleLabel } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

const AVATAR_SIZE = AppSize.ratioWidth(50);

// 화살표 아이콘 SVG
const chevronRightSvg = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18L15 12L9 6" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 기본 아바타 아이콘 SVG
const defaultAvatarSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserManagementItemProps {
  readonly user: UserManagementItemType;
  readonly onPress: (user: UserManagementItemType) => void;
}

export const UserManagementItem = memo(function UserManagementItem({
  user,
  onPress,
}: UserManagementItemProps) {
  const handlePress = useCallback(() => {
    onPress(user);
  }, [user, onPress]);

  // 가입일 포맷
  const formattedDate = formatDate(user.createdAt);

  // 표시할 이름
  const displayName = user.displayName || '이름 없음';

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      {/* 아바타 */}
      <AvatarContainer>
        {user.avatarUrl ? (
          <LoadableImageView
            source={user.avatarUrl}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
          />
        ) : (
          <DefaultAvatar>
            <SvgXml xml={defaultAvatarSvg} width={24} height={24} />
          </DefaultAvatar>
        )}
      </AvatarContainer>

      <Gap size={12} />

      {/* 정보 */}
      <InfoContainer>
        <NameRow>
          <UserName numberOfLines={1}>{displayName}</UserName>
          <RoleBadge userRole={user.role}>
            <RoleText userRole={user.role}>{UserRoleLabel[user.role]}</RoleText>
          </RoleBadge>
        </NameRow>
        <Gap size={2} />
        {user.email && <UserEmail numberOfLines={1}>{user.email}</UserEmail>}
        <Gap size={4} />
        <MetaRow>
          <MetaText>가입: {formattedDate}</MetaText>
          <MetaDot />
          <MetaText>방문: {user.entryCount}회</MetaText>
        </MetaRow>
      </InfoContainer>

      {/* 화살표 */}
      <ChevronContainer>
        <SvgXml xml={chevronRightSvg} width={16} height={16} />
      </ChevronContainer>
    </Container>
  );
});

/**
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * 역할별 색상 반환
 */
function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return colors.primary;
    case 'banned':
      return colors.red;
    case 'user':
    default:
      return colors.gray02;
  }
}

/* Styled Components */
const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.black,
});

const AvatarContainer = styled(View)({
  position: 'relative',
});

const DefaultAvatar = styled(View)({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
});

const InfoContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
});

const NameRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
});

const UserName = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  flex: 1,
});

interface RoleStyleProps {
  userRole: UserRole;
}

const RoleBadge = styled(View)<RoleStyleProps>(({ userRole }) => ({
  backgroundColor: `${getRoleColor(userRole)}20`,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
}));

const RoleText = styled.Text<RoleStyleProps>(({ userRole }) => ({
  ...textStyles.alert2,
  color: getRoleColor(userRole),
  fontSize: 10,
  fontWeight: '600',
}));

const UserEmail = styled.Text({
  ...textStyles.desc,
  color: colors.gray01,
});

const MetaRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
});

const MetaText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const MetaDot = styled(View)({
  width: 3,
  height: 3,
  borderRadius: 1.5,
  backgroundColor: colors.gray04,
  marginHorizontal: 6,
});

const ChevronContainer = styled(View)({
  marginLeft: 8,
});
