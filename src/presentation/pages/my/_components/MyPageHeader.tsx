/**
 * MyPageHeader - MY 페이지 상단 앱바
 *
 * MY 탭 상단에 표시되는 헤더입니다.
 * - 좌측: "MY" 타이틀
 * - 우측: 로그인 시 설정 아이콘, 비로그인 시 로그인 버튼
 */

import { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { useAuth } from '@/shared/providers/AuthProvider';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { useSocialLogin } from '@/presentation/pages/login/_hooks/useSocialLogin';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import GearIcon from '@assets/icons/gear.svg';

interface MyPageHeaderProps {
  /** 설정 버튼 클릭 시 콜백 */
  readonly onSettingsPress?: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ICON_SIZE = 20;

function MyPageHeader({ onSettingsPress }: MyPageHeaderProps) {
  const navigation = useNavigation<NavigationProp>();
  const { status } = useAuth();
  const { handleLogin, loadingProvider } = useSocialLogin();

  const isGuest = status === 'unauthenticated';

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  const handleLoginPress = useCallback(() => {
    setLoginDialogVisible(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

  const handleKakaoLogin = useCallback(() => {
    handleLogin('kakao');
    setLoginDialogVisible(false);
  }, [handleLogin]);

  const handleOtherLogin = useCallback(() => {
    navigation.navigate(routePages.login, { canGoBack: true });
    setLoginDialogVisible(false);
  }, [navigation]);

  return (
    <>
      <Container>
        <TitleText>MY</TitleText>
        <RightSection>
          {isGuest && (
            <LoginButton onPress={handleLoginPress} activeOpacity={0.8}>
              <LoginButtonText>로그인</LoginButtonText>
            </LoginButton>
          )}
          <TouchableOpacity onPress={onSettingsPress} activeOpacity={0.7}>
            <GearIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.white} />
          </TouchableOpacity>
        </RightSection>
      </Container>
      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={handleCloseDialog}
        onKakaoLogin={handleKakaoLogin}
        onOtherLogin={handleOtherLogin}
        isKakaoLoading={loadingProvider === 'kakao'}
      />
    </>
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

export { MyPageHeader };
