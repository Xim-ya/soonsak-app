/**
 * CurationPromptCard - 로그인 유도 텍스트 섹션
 *
 * 비로그인 사용자에게 맞춤 큐레이션 안내 텍스트를 표시합니다.
 * 하단 그라데이션 위에 텍스트를 직접 표시합니다.
 *
 * @example
 * <CurationPromptCard onLoginPress={() => setLoginDialogVisible(true)} />
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';

interface CurationPromptCardProps {
  readonly onLoginPress?: () => void;
}

function CurationPromptCard({ onLoginPress }: CurationPromptCardProps): React.ReactElement {
  return (
    <Container>
      <TitleRow>
        <TitleText>나만의 큐레이션</TitleText>
        {onLoginPress && (
          <LoginButton onPress={onLoginPress} activeOpacity={0.8}>
            <LoginButtonText>로그인</LoginButtonText>
          </LoginButton>
        )}
      </TitleRow>
      <DescriptionText>로그인하면 취향에 맞는 콘텐츠를 추천받을 수 있어요</DescriptionText>
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  paddingHorizontal: 16,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
});

const TitleText = styled.Text({
  ...textStyles.headline2,
  color: colors.white,
});

const LoginButton = styled(TouchableOpacity)({
  backgroundColor: colors.gray04,
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 16,
  marginLeft: 10,
});

const LoginButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const DescriptionText = styled.Text({
  ...textStyles.body2,
  color: colors.gray01,
});

export { CurationPromptCard };
