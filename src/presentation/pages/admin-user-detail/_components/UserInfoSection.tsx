/**
 * UserInfoSection - 유저 기본 정보 섹션
 *
 * 아바타, 이름, 이메일, 가입일, 최근 로그인 등 기본 정보를 표시합니다.
 */

import { memo } from 'react';
import { View } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { UserDetailItem } from '@/features/admin';
import { UserRoleLabel } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

const AVATAR_SIZE = AppSize.ratioWidth(80);

// 기본 아바타 아이콘 SVG
const defaultAvatarSvg = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserInfoSectionProps {
  readonly user: UserDetailItem;
}

export const UserInfoSection = memo(function UserInfoSection({ user }: UserInfoSectionProps) {
  const displayName = user.displayName || '이름 없음';
  const createdAtFormatted = formatDateTime(user.createdAt);
  const lastLoginAtFormatted = user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-';

  return (
    <Container>
      {/* 아바타 + 이름 + 역할 */}
      <ProfileRow>
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
              <SvgXml xml={defaultAvatarSvg} width={40} height={40} />
            </DefaultAvatar>
          )}
        </AvatarContainer>
        <NameContainer>
          <UserName>{displayName}</UserName>
          <RoleBadge userRole={user.role}>
            <RoleText userRole={user.role}>{UserRoleLabel[user.role]}</RoleText>
          </RoleBadge>
        </NameContainer>
      </ProfileRow>

      {/* 상세 정보 */}
      <InfoGrid>
        <InfoItem>
          <InfoLabel>이메일</InfoLabel>
          <InfoValue>{user.email || '-'}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>로그인 방식</InfoLabel>
          <InfoValue>{user.providers.join(', ') || '-'}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>가입일</InfoLabel>
          <InfoValue>{createdAtFormatted}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>최근 로그인</InfoLabel>
          <InfoValue>{lastLoginAtFormatted}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>앱 방문 횟수</InfoLabel>
          <InfoValue>{user.entryCount}회</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>유저 ID</InfoLabel>
          <InfoValue numberOfLines={1} ellipsizeMode="middle">
            {user.id}
          </InfoValue>
        </InfoItem>
      </InfoGrid>
    </Container>
  );
});

/**
 * ISO 날짜 문자열을 YYYY.MM.DD HH:mm 형식으로 변환
 */
function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
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
const Container = styled(View)({
  padding: 16,
  backgroundColor: colors.black,
});

const ProfileRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 24,
});

const AvatarContainer = styled(View)({
  marginRight: 16,
});

const DefaultAvatar = styled(View)({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
});

const NameContainer = styled(View)({
  flex: 1,
});

const UserName = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 8,
});

interface RoleStyleProps {
  userRole: UserRole;
}

const RoleBadge = styled(View)<RoleStyleProps>(({ userRole }) => ({
  backgroundColor: `${getRoleColor(userRole)}20`,
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 6,
  alignSelf: 'flex-start',
}));

const RoleText = styled.Text<RoleStyleProps>(({ userRole }) => ({
  ...textStyles.body2,
  color: getRoleColor(userRole),
  fontWeight: '600',
}));

const InfoGrid = styled(View)({
  gap: 16,
});

const InfoItem = styled(View)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const InfoLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  flex: 1,
});

const InfoValue = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  flex: 2,
  textAlign: 'right',
});
