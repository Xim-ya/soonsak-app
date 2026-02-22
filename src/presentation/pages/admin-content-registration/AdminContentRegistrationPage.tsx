/**
 * AdminContentRegistrationPage - 어드민 콘텐츠 등록 페이지
 *
 * YouTube 영상/채널 URL을 입력받아 콘텐츠를 등록합니다.
 * - 영상 추가 탭: 개별 영상 URL 입력 (여러 개 일괄 입력 지원)
 * - 채널 추가 탭: 채널 URL 입력 후 최근/전체 영상 등록
 */

import { useCallback } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { RegistrationTabBar, VideoRegistrationTab, ChannelRegistrationTab } from './_components';
import { useContentRegistration } from './_hooks/useContentRegistration';

export default function AdminContentRegistrationPage() {
  const insets = useSafeAreaInsets();

  const {
    activeTab,
    setActiveTab,
    videoUrlInput,
    setVideoUrlInput,
    videoRegistrationResult,
    isRegisteringVideos,
    registerVideos,
    videoProgress,
    channelUrlInput,
    setChannelUrlInput,
    channelRegisterMode,
    setChannelRegisterMode,
    recentVideoCount,
    setRecentVideoCount,
    channelRegistrationResult,
    isRegisteringChannel,
    registerChannel,
    clearResults,
    error,
  } = useContentRegistration();

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: typeof activeTab) => {
      clearResults();
      setActiveTab(tab);
    },
    [clearResults, setActiveTab],
  );

  // 에러 표시
  if (error) {
    Alert.alert('오류', error);
  }

  return (
    <BasePage useSafeArea={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* 헤더 */}
        <HeaderContainer paddingTop={insets.top}>
          <BackButtonAppBar title="콘텐츠 등록" />
        </HeaderContainer>

        {/* 탭 바 */}
        <RegistrationTabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* 콘텐츠 영역 */}
        <ContentContainer>
          {activeTab === 'video' ? (
            <VideoRegistrationTab
              urlInput={videoUrlInput}
              onUrlInputChange={setVideoUrlInput}
              isRegistering={isRegisteringVideos}
              progress={videoProgress}
              result={videoRegistrationResult}
              onRegister={registerVideos}
            />
          ) : (
            <ChannelRegistrationTab
              urlInput={channelUrlInput}
              onUrlInputChange={setChannelUrlInput}
              registerMode={channelRegisterMode}
              onRegisterModeChange={setChannelRegisterMode}
              recentVideoCount={recentVideoCount}
              onRecentVideoCountChange={setRecentVideoCount}
              isRegistering={isRegisteringChannel}
              result={channelRegistrationResult}
              onRegister={registerChannel}
            />
          )}
        </ContentContainer>
      </KeyboardAvoidingView>
    </BasePage>
  );
}

/* Styled Components */

const HeaderContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  backgroundColor: colors.black,
  paddingTop,
}));

const ContentContainer = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});
