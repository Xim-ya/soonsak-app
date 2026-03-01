/**
 * MyScreenHeader - MY 페이지 상단 앱바
 *
 * MY 탭 상단에 표시되는 헤더입니다.
 * - 좌측: "MY" 타이틀
 * - 우측: 로그인 시 설정 아이콘, 비로그인 시 로그인 버튼
 */

import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { useMyScreen } from '../_provider';
import GearIcon from '@assets/icons/gear.svg';

const ICON_SIZE = 20;

function MyScreenHeader() {
  const { isGuest, showLoginDialog, handleSettingsPress } = useMyScreen();

  return (
    <Container>
      <TitleText>MY</TitleText>
      <RightSection>
        {isGuest && (
          <LoginButton onPress={showLoginDialog} activeOpacity={0.8}>
            <LoginButtonText>로그인</LoginButtonText>
          </LoginButton>
        )}
        <TouchableOpacity onPress={handleSettingsPress} activeOpacity={0.7}>
          <GearIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.white} />
        </TouchableOpacity>
      </RightSection>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: AppSize.ratioWidth(16),
  paddingTop: AppSize.ratioHeight(8),
  paddingBottom: AppSize.ratioHeight(4),
});

const TitleText = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const RightSection = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: AppSize.ratioWidth(12),
});

const LoginButton = styled(TouchableOpacity)({
  backgroundColor: colors.gray04,
  paddingHorizontal: AppSize.ratioWidth(12),
  paddingVertical: AppSize.ratioHeight(6),
  borderRadius: 16,
});

const LoginButtonText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

export { MyScreenHeader };
