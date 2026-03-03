/**
 * ProfileSetupScreen - 프로필 설정 페이지
 *
 * 초기 설정과 수정 두 가지 모드를 지원합니다:
 * - initial: 회원가입 직후 진입, 뒤로가기 차단
 * - edit: 마이페이지에서 진입, 뒤로가기 허용
 *
 * @example
 * // 초기 설정 모드
 * navigation.navigate('ProfileSetup', { mode: 'initial' });
 *
 * // 수정 모드
 * navigation.navigate('ProfileSetup', { mode: 'edit' });
 */

import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { PrimaryButton } from '@/presentation/components/button';
import { AppDialog } from '@/presentation/components/dialog/AppDialog';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ProfileSetupProvider, useProfileSetupContext } from './_provider/ProfileSetupProvider';
import { NicknameInput } from './_components/NicknameInput';
import { ProfileImagePicker } from './_components/ProfileImagePicker';

type ProfileSetupRouteProp = RouteProp<RootStackParamList, typeof routePages.profileSetup>;

/** 레이아웃 스타일 상수 */
const keyboardAvoidingStyle = { flex: 1 } as const;
const scrollContentStyle = { flexGrow: 1 } as const;

export default function ProfileSetupScreen(): React.ReactElement {
  const route = useRoute<ProfileSetupRouteProp>();
  const { mode } = route.params;

  return (
    <ProfileSetupProvider mode={mode}>
      <ProfileSetupContent />
    </ProfileSetupProvider>
  );
}

/**
 * ProfileSetupContent - 실제 프로필 설정 화면 내용
 *
 * ProfileSetupProvider 내부에서 렌더링되어 Context에 접근 가능
 */
function ProfileSetupContent(): React.ReactElement {
  const {
    showBackButton,
    buttonText,
    buttonState,
    handleSubmit,
    mode,
    isPermissionDialogVisible,
    closePermissionDialog,
    openSettings,
    isSettingsErrorDialogVisible,
    closeSettingsErrorDialog,
  } = useProfileSetupContext();

  return (
    <>
      <BasePage automaticallyAdjustKeyboardInsets={false}>
        <Container>
          {/* 앱바 - 뒤로가기 버튼만 표시 */}
          <BackButtonAppBar showBackButton={showBackButton} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={keyboardAvoidingStyle}
          >
            <ScrollView
              contentContainerStyle={scrollContentStyle}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 콘텐츠 영역 */}
              <ContentContainer>
                {/* 프로필 이미지 */}
                <ImageSection>
                  <ProfileImagePicker />
                </ImageSection>

                {/* 닉네임 입력 */}
                <InputSection>
                  <SectionLabel>닉네임</SectionLabel>
                  <NicknameInput autoFocus={mode === 'initial'} />
                </InputSection>
              </ContentContainer>

              {/* 하단 버튼 */}
              <ButtonContainer>
                <PrimaryButton title={buttonText} onPress={handleSubmit} state={buttonState} />
              </ButtonContainer>
            </ScrollView>
          </KeyboardAvoidingView>
        </Container>
      </BasePage>

      {/* 권한 요청 다이얼로그 */}
      <AppDialog
        visible={isPermissionDialogVisible}
        title="사진에 접근할 수 없어요"
        description="설정에서 사진 접근을 허용하면 프로필 사진을 바꿀 수 있어요"
        isDivided
        leftButtonText="다음에"
        rightButtonText="설정 열기"
        onLeftButtonPress={closePermissionDialog}
        onRightButtonPress={openSettings}
        onBackdropPress={closePermissionDialog}
      />

      {/* 설정 열기 실패 다이얼로그 */}
      <AppDialog
        visible={isSettingsErrorDialogVisible}
        title="설정을 열 수 없어요"
        description="알 수 없는 오류가 발생했어요. 직접 설정 앱에서 사진 접근을 허용해 주세요."
        buttonText="확인"
        onButtonPress={closeSettingsErrorDialog}
        onBackdropPress={closeSettingsErrorDialog}
      />
    </>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const ContentContainer = styled.View({
  flex: 1,
  paddingHorizontal: 24,
  paddingTop: 32,
});

const ImageSection = styled.View({
  alignItems: 'center',
  marginBottom: 40,
});

const InputSection = styled.View({
  marginBottom: 24,
});

const SectionLabel = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 12,
});

const ButtonContainer = styled.View({
  paddingHorizontal: 24,
  paddingBottom: AppSize.bottomInset + 12,
  paddingTop: 12,
});
