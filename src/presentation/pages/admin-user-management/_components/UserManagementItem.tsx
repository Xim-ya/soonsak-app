/**
 * UserManagementItem - 유저 관리 아이템
 *
 * 유저 정보를 표시하고, 탭하면 유저 상세 페이지로 이동
 */

import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { UserManagementModel } from '../_types';
import { UserRoleLabel, getRoleColor, formatDate } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

const AVATAR_SIZE = AppSize.ratioWidth(50);

// SVG 아이콘 상수 (컴포넌트 외부로 최적화)
const CHEVRON_RIGHT_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18L15 12L9 6" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const DEFAULT_AVATAR_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserManagementItemProps {
  readonly user: UserManagementModel;
  readonly onPress: (user: UserManagementModel) => void;
}

export const UserManagementItem = memo(
  function UserManagementItem({ user, onPress }: UserManagementItemProps) {
    const handlePress = useCallback(() => {
      onPress(user);
    }, [user, onPress]);

    // 포맷팅 값 메모이제이션 (리렌더링 방지)
    const formattedDate = useMemo(() => formatDate(user.createdAt), [user.createdAt]);
    const displayName = useMemo(() => user.displayName || '이름 없음', [user.displayName]);

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
              <SvgXml xml={DEFAULT_AVATAR_SVG} width={24} height={24} />
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
          <SvgXml xml={CHEVRON_RIGHT_SVG} width={16} height={16} />
        </ChevronContainer>
      </Container>
    );
  },
  // props 비교 최적화: user.id가 같으면 리렌더링 방지
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id,
);

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
