/**
 * ExploreHeader - 탐색 화면 헤더
 *
 * 로그인 상태에 따라 다른 콘텐츠를 표시합니다:
 * - 로그인: 랜덤 큐레이션 캐러셀
 * - 비로그인: 로그인 유도 카드 (백드롭 이미지 배경)
 *
 * Collapsible Tab View의 헤더로 사용됩니다.
 */

import React, { useCallback, useState } from 'react';
import { ImageBackground, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { useAuth } from '@/shared/providers/AuthProvider';
import { CurationCarousel } from './CurationCarousel';
import { CurationPromptCard } from './CurationPromptCard';
import { useRandomBackdrop } from '../_hooks/useRandomBackdrop';

// 레이아웃 상수
const HEADER_HEIGHT = AppSize.ratioHeight(280);
const TOP_GRADIENT_HEIGHT = AppSize.ratioHeight(80);
const BOTTOM_GRADIENT_HEIGHT = AppSize.ratioHeight(180);

const ExploreHeader = React.memo(function ExploreHeader(): React.ReactElement {
  const { status, signOut } = useAuth();
  const isLoggedIn = status === 'authenticated';

  const { backdropUrl } = useRandomBackdrop();

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  const handleLoginPress = useCallback(() => {
    setLoginDialogVisible(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

  // TODO: 테스트용 로그아웃 - 개발 완료 후 제거
  const handleLogoutPress = useCallback(() => {
    signOut();
  }, [signOut]);

  // 로그인 상태: 캐러셀만 표시 (백드롭/그라데이션 없음)
  if (isLoggedIn) {
    return (
      <LoggedInContainer>
        <TitleRow>
          <TitleText>탐색</TitleText>
          <LoginButton onPress={handleLogoutPress} activeOpacity={0.8}>
            <LoginButtonText>로그아웃</LoginButtonText>
          </LoginButton>
        </TitleRow>
        <CurationCarousel />
      </LoggedInContainer>
    );
  }

  // 비로그인 상태: 백드롭 이미지가 없을 때 폴백 렌더링
  if (!backdropUrl) {
    return (
      <>
        <FallbackContainer>
          <TitleRow>
            <TitleText>탐색</TitleText>
            <LoginButton onPress={handleLoginPress} activeOpacity={0.8}>
              <LoginButtonText>로그인</LoginButtonText>
            </LoginButton>
          </TitleRow>
          <CurationPromptCard />
        </FallbackContainer>
        <LoginPromptDialog visible={isLoginDialogVisible} onClose={handleCloseDialog} />
      </>
    );
  }

  // 비로그인 상태: 백드롭 이미지 + 그라데이션 + 로그인 유도 카드
  return (
    <>
      <Container>
        <BackdropImage source={{ uri: backdropUrl }} resizeMode="cover">
          {/* 상단 그라데이션 */}
          <DarkedLinearShadow height={TOP_GRADIENT_HEIGHT} align={LinearAlign.topBottom} />

          <ContentOverlay>
            <TitleRow>
              <TitleText>탐색</TitleText>
              <LoginButton onPress={handleLoginPress} activeOpacity={0.8}>
                <LoginButtonText>로그인</LoginButtonText>
              </LoginButton>
            </TitleRow>

            <CardSection>
              <CurationPromptCard />
            </CardSection>
          </ContentOverlay>

          {/* 하단 그라데이션 */}
          <DarkedLinearShadow height={BOTTOM_GRADIENT_HEIGHT} align={LinearAlign.bottomTop} />
        </BackdropImage>
      </Container>
      <LoginPromptDialog visible={isLoginDialogVisible} onClose={handleCloseDialog} />
    </>
  );
});

/* Styled Components */
const Container = styled.View({
  height: HEADER_HEIGHT,
  backgroundColor: colors.black,
});

const LoggedInContainer = styled.View({
  backgroundColor: colors.black,
  paddingTop: 16,
  paddingBottom: 20,
});

const FallbackContainer = styled.View({
  backgroundColor: colors.black,
  paddingTop: 16,
  paddingBottom: 20,
});

const BackdropImage = styled(ImageBackground)({
  flex: 1,
  width: '100%',
});

const ContentOverlay = styled.View({
  position: 'relative',
  flex: 1,
  justifyContent: 'space-between',
  paddingTop: AppSize.statusBarHeight + 16,
  paddingBottom: 24,
  zIndex: 1,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  marginBottom: 16,
});

const CardSection = styled.View({
  flex: 1,
  justifyContent: 'flex-end',
});

const TitleText = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
});

const LoginButton = styled(TouchableOpacity)({
  backgroundColor: colors.gray04,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
});

const LoginButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

export { ExploreHeader };
