/**
 * NicknameInput - 닉네임 입력 컴포넌트
 *
 * 닉네임 입력 필드와 유효성 검사 메시지를 표시합니다.
 *
 * @example
 * <NicknameInput
 *   value={nickname}
 *   onChangeText={setNickname}
 *   error={error}
 * />
 */

import React, { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { NICKNAME_RULES } from '@/features/user/constants/nicknameValidation';

/** 레이아웃 상수 */
const INPUT_HEIGHT = 52;
const INPUT_BORDER_RADIUS = 12;
const INPUT_PADDING_HORIZONTAL = 16;

interface NicknameInputProps {
  /** 현재 입력값 */
  readonly value: string;
  /** 입력 변경 핸들러 */
  readonly onChangeText: (text: string) => void;
  /** 에러 메시지 */
  readonly error: string | null;
  /** 포커스 여부 */
  readonly autoFocus?: boolean;
}

function NicknameInput({
  value,
  onChangeText,
  error,
  autoFocus = true,
}: NicknameInputProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);

  const hasError = error !== null && error.length > 0;
  const isValid = !hasError && value.length >= NICKNAME_RULES.MIN_LENGTH;

  // 힌트 메시지
  const hintMessage = `${NICKNAME_RULES.MIN_LENGTH}~${NICKNAME_RULES.MAX_LENGTH}자, 한글/영문/숫자/_/- 사용 가능`;

  const handleSubmitEditing = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  return (
    <Container>
      {/* 입력 필드 */}
      <InputContainer hasError={hasError} isValid={isValid}>
        <StyledTextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="닉네임을 입력하세요"
          placeholderTextColor={colors.gray03}
          maxLength={NICKNAME_RULES.MAX_LENGTH}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmitEditing}
        />
      </InputContainer>

      {/* 에러 또는 힌트 메시지 */}
      <MessageContainer>
        {hasError ? <ErrorText>{error}</ErrorText> : <HintText>{hintMessage}</HintText>}
      </MessageContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  width: '100%',
});

const InputContainer = styled.View<{ hasError: boolean; isValid: boolean }>(
  ({ hasError, isValid }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_HEIGHT,
    backgroundColor: colors.gray05,
    borderRadius: INPUT_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: hasError ? colors.red : isValid ? colors.green : colors.gray04,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
  }),
);

const StyledTextInput = styled(TextInput)({
  flex: 1,
  ...textStyles.body1,
  color: colors.white,
  paddingVertical: 0,
});

const MessageContainer = styled.View({
  marginTop: 8,
  paddingHorizontal: 4,
});

const HintText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const ErrorText = styled.Text({
  ...textStyles.alert2,
  color: colors.red,
});

export { NicknameInput };
