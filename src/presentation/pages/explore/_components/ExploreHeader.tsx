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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import LightningIcon from '@assets/icons/lightning.svg';
import { CurationCarousel } from './CurationCarousel';
import { CurationPromptCard } from './CurationPromptCard';
import { useRandomBackdrop } from '../_hooks/useRandomBackdrop';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 레이아웃 상수
const HEADER_HEIGHT = AppSize.ratioHeight(280);
const TOP_GRADIENT_HEIGHT = AppSize.ratioHeight(80);
const BOTTOM_GRADIENT_HEIGHT = AppSize.ratioHeight(180);

const ExploreHeader = React.memo(function ExploreHeader(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { status } = useAuth();
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

  // 빠른탐색 페이지로 이동
  const handleQuickExplorePress = useCallback(() => {
    navigation.navigate(routePages.quickExplore);
  }, [navigation]);

  // 로그인 상태: 캐러셀만 표시 (백드롭/그라데이션 없음)
  if (isLoggedIn) {
    return (
      <LoggedInContainer>
        <TitleRow>
          <TitleText>탐색</TitleText>
          <QuickExploreChip onPress={handleQuickExplorePress} activeOpacity={0.8}>
            <LightningIcon width={14} height={14} color={colors.main} />
            <QuickExploreChipText>빠른탐색</QuickExploreChipText>
          </QuickExploreChip>
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
          <FallbackContentOverlay>
            <TitleRow>
              <TitleText>탐색</TitleText>
              <ActionButtonRow>
                <QuickExploreChip onPress={handleQuickExplorePress} activeOpacity={0.8}>
                  <LightningIcon width={14} height={14} color={colors.main} />
                  <QuickExploreChipText>빠른탐색</QuickExploreChipText>
                </QuickExploreChip>
                <LoginButton onPress={handleLoginPress} activeOpacity={0.8}>
                  <LoginButtonText>로그인</LoginButtonText>
                </LoginButton>
              </ActionButtonRow>
            </TitleRow>
            <CardSection>
              <CurationPromptCard />
            </CardSection>
          </FallbackContentOverlay>
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
              <ActionButtonRow>
                <QuickExploreChip onPress={handleQuickExplorePress} activeOpacity={0.8}>
                  <LightningIcon width={14} height={14} color={colors.main} />
                  <QuickExploreChipText>빠른탐색</QuickExploreChipText>
                </QuickExploreChip>
                <LoginButton onPress={handleLoginPress} activeOpacity={0.8}>
                  <LoginButtonText>로그인</LoginButtonText>
                </LoginButton>
              </ActionButtonRow>
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
  minHeight: HEADER_HEIGHT, // 비로그인 상태와 동일한 최소 높이 (레이아웃 점프 방지)
  backgroundColor: colors.black,
  paddingTop: 16,
  paddingBottom: 20,
});

const FallbackContainer = styled.View({
  height: HEADER_HEIGHT, // Container와 동일한 높이 (레이아웃 점프 방지)
  backgroundColor: colors.black,
});

/** 공통 오버레이 베이스 스타일 */
const OVERLAY_BASE_STYLE = {
  flex: 1,
  justifyContent: 'space-between' as const,
  paddingTop: AppSize.statusBarHeight + 16,
  paddingBottom: 24,
};

const FallbackContentOverlay = styled.View(OVERLAY_BASE_STYLE);

const BackdropImage = styled(ImageBackground)({
  flex: 1,
  width: '100%',
});

const ContentOverlay = styled.View({
  ...OVERLAY_BASE_STYLE,
  position: 'relative',
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

const ActionButtonRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
});

const QuickExploreChip = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray04,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  gap: 4,
});

const QuickExploreChipText = styled.Text({
  ...textStyles.alert1,
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
