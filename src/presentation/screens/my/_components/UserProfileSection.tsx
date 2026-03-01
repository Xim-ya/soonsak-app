/**
 * UserProfileSection - 사용자 프로필 섹션
 *
 * MY 탭 상단에 표시되는 사용자 프로필 정보입니다.
 * - 프로필 이미지 (원형)
 * - 사용자 이름
 * - 우측 화살표 아이콘
 */

import React, { memo } from 'react';
import styled from '@emotion/native';
import { TouchableOpacity } from 'react-native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface UserProfileSectionProps {
  /** 사용자 이름 */
  readonly displayName: string;
  /** 프로필 이미지 URL */
  readonly avatarUrl?: string | undefined;
  /** 프로필 클릭 시 콜백 */
  readonly onPress?: () => void;
}

const AVATAR_SIZE = 48;
const ICON_SIZE = 20;

function UserProfileSectionComponent({ displayName, avatarUrl, onPress }: UserProfileSectionProps) {
  // 프로필 이미지가 없는 경우 이니셜 표시용 텍스트
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Container>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <ProfileRow>
          {avatarUrl ? (
            <RoundedAvatorView source={avatarUrl} size={AVATAR_SIZE} />
          ) : (
            <InitialAvatar>
              <InitialText>{initial}</InitialText>
            </InitialAvatar>
          )}
          <UserInfo>
            <UserName numberOfLines={1}>{displayName}</UserName>
          </UserInfo>
          <RightArrowIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.gray02} />
        </ProfileRow>
      </TouchableOpacity>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  paddingHorizontal: AppSize.ratioWidth(16),
  paddingVertical: AppSize.ratioHeight(16),
});

const ProfileRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const InitialAvatar = styled.View({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
});

const InitialText = styled.Text({
  ...textStyles.title1,
  color: colors.gray02,
});

const UserInfo = styled.View({
  flex: 1,
  marginLeft: AppSize.ratioWidth(12),
  marginRight: AppSize.ratioWidth(8),
});

const UserName = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

export const UserProfileSection = memo(UserProfileSectionComponent);
