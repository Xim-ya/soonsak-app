/**
 * LoginPromptDialog - 로그인 유도 다이얼로그
 *
 * 비로그인 사용자에게 로그인을 유도하는 모달 다이얼로그입니다.
 * 카카오 빠른 로그인과 다른 방법 로그인 옵션을 제공합니다.
 *
 * 로그인 관련 로직이 내장되어 있어 visible과 onClose만 전달하면 됩니다.
 * onLoginSuccess 콜백으로 로그인 성공 후 추가 액션을 실행할 수 있습니다.
 * (Toss Frontend Fundamentals - 응집도 원칙 적용)
 *
 * @example
 * <LoginPromptDialog
 *   visible={isDialogVisible}
 *   onClose={() => setDialogVisible(false)}
 *   onLoginSuccess={() => toggleFavorite()}
 * />
 */

import React, { useCallback } from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useSocialLogin } from '@/presentation/pages/login/_hooks/useSocialLogin';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import KakaoLogo from '@assets/icons/kakao_logo.svg';
import PopcornIllustration from '@assets/icons/popcorn_illustration.svg';

const BUTTON_HEIGHT = 44;
const BUTTON_RADIUS = 8;
const DIALOG_RADIUS = 16;
const LOGO_SIZE = 18;
const ILLUSTRATION_SIZE = 72;

// 카카오 브랜드 색상
const KAKAO_YELLOW = '#FEE500';
const KAKAO_BLACK = '#191919';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LoginPromptDialogProps {
  /** 다이얼로그 표시 여부 */
  readonly visible: boolean;
  /** 닫기 버튼 또는 배경 터치 시 호출 */
  readonly onClose: () => void;
  /** 로그인 성공 시 호출 (찜 토글 등 후속 액션 실행용) */
  readonly onLoginSuccess?: (() => void) | undefined;
}

function LoginPromptDialog({
  visible,
  onClose,
  onLoginSuccess,
}: LoginPromptDialogProps): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { handleLogin, loadingProvider } = useSocialLogin();

  const isKakaoLoading = loadingProvider === 'kakao';

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDialogPress = useCallback(() => {
    // 다이얼로그 내부 터치 시 이벤트 전파 방지
  }, []);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = useCallback(() => {
    handleLogin('kakao', onLoginSuccess);
    onClose();
  }, [handleLogin, onClose, onLoginSuccess]);

  // 다른 방법으로 로그인 핸들러
  const handleOtherLogin = useCallback(() => {
    navigation.navigate(routePages.login, {
      canGoBack: true,
      ...(onLoginSuccess && { onLoginSuccess }), // undefined가 아닐 때만 전달
    });
    onClose();
  }, [navigation, onClose, onLoginSuccess]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Overlay>
          <TouchableWithoutFeedback onPress={handleDialogPress}>
            <DialogContainer>
              {/* 일러스트 */}
              <IllustrationWrapper>
                <PopcornIllustration width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} />
              </IllustrationWrapper>

              {/* 타이틀 */}
              <TitleText>로그인하고{'\n'}모든 기능을 자유롭게 사용해보세요!</TitleText>

              {/* 버튼 그룹 */}
              <ButtonGroup>
                {/* 카카오 로그인 버튼 */}
                <KakaoButton
                  onPress={handleKakaoLogin}
                  activeOpacity={0.8}
                  disabled={isKakaoLoading}
                >
                  <KakaoLogoWrapper>
                    <KakaoLogo width={LOGO_SIZE} height={LOGO_SIZE} />
                  </KakaoLogoWrapper>
                  <KakaoButtonText>카카오로 시작하기</KakaoButtonText>
                </KakaoButton>

                {/* 다른 방법으로 시작하기 버튼 */}
                <OtherLoginButton onPress={handleOtherLogin} activeOpacity={0.8}>
                  <OtherLoginButtonText>다른 방법으로 시작하기</OtherLoginButtonText>
                </OtherLoginButton>
              </ButtonGroup>

              {/* 닫기 버튼 */}
              <CloseButton onPress={onClose} activeOpacity={0.7}>
                <CloseButtonText>닫기</CloseButtonText>
              </CloseButton>
            </DialogContainer>
          </TouchableWithoutFeedback>
        </Overlay>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* Styled Components */

const Overlay = styled.View({
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 32,
});

const DialogContainer = styled.View({
  width: '100%',
  backgroundColor: colors.gray05,
  borderRadius: DIALOG_RADIUS,
  paddingTop: 24,
  paddingBottom: 16,
  paddingHorizontal: 20,
  alignItems: 'center',
});

const IllustrationWrapper = styled.View({
  marginBottom: 16,
});

const TitleText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  textAlign: 'center',
  marginBottom: 20,
});

const ButtonGroup = styled.View({
  width: '100%',
  gap: 8,
});

const KakaoButton = styled(TouchableOpacity)({
  height: BUTTON_HEIGHT,
  borderRadius: BUTTON_RADIUS,
  backgroundColor: KAKAO_YELLOW,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
});

const KakaoLogoWrapper = styled.View({
  marginRight: 8,
});

const KakaoButtonText = styled.Text({
  ...textStyles.body2,
  color: KAKAO_BLACK,
});

const OtherLoginButton = styled(TouchableOpacity)({
  height: BUTTON_HEIGHT,
  borderRadius: BUTTON_RADIUS,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
});

const OtherLoginButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const CloseButton = styled(TouchableOpacity)({
  marginTop: 12,
  paddingVertical: 6,
  paddingHorizontal: 12,
});

const CloseButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.gray02,
});

export { LoginPromptDialog };
