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

import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { PrimaryButton, type ButtonState } from '@/presentation/components/button';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useProfileSetup } from './_hooks/useProfileSetup';
import { NicknameInput } from './_components/NicknameInput';
import { ProfileImagePicker } from './_components/ProfileImagePicker';

type ProfileSetupRouteProp = RouteProp<RootStackParamList, typeof routePages.profileSetup>;

/** 레이아웃 스타일 상수 */
const keyboardAvoidingStyle = { flex: 1 } as const;
const scrollContentStyle = { flexGrow: 1 } as const;

export default function ProfileSetupScreen(): React.ReactElement {
  const route = useRoute<ProfileSetupRouteProp>();
  const { mode } = route.params;

  const {
    nickname,
    setNickname,
    avatarUrl,
    error,
    isLoading,
    isValid,
    isChanged,
    handlePickImage,
    handleSubmit,
  } = useProfileSetup({ mode });

  // 모드별 UI 텍스트
  const buttonText = mode === 'initial' ? '시작하기' : '저장';
  const showBackButton = mode === 'edit';

  // 버튼 활성화 조건
  const isButtonEnabled = mode === 'initial' ? isValid : isValid && isChanged;

  // 버튼 상태 계산
  const buttonState: ButtonState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isButtonEnabled) return 'enabled';
    return 'disabled';
  }, [isLoading, isButtonEnabled]);

  return (
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
                <ProfileImagePicker imageUrl={avatarUrl} onPress={handlePickImage} />
              </ImageSection>

              {/* 닉네임 입력 */}
              <InputSection>
                <SectionLabel>닉네임</SectionLabel>
                <NicknameInput
                  value={nickname}
                  onChangeText={setNickname}
                  error={error}
                  autoFocus={mode === 'initial'}
                />
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
