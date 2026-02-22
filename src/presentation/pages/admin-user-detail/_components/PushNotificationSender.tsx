/**
 * PushNotificationSender - 푸시 알림 발송 모달
 *
 * 개인 푸시 알림을 발송할 수 있는 UI를 제공합니다.
 */

import { memo, useCallback, useState } from 'react';
import {
  TouchableOpacity,
  Modal,
  Pressable,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

// ============================================================================
// Constants
// ============================================================================

/** 제목 최대 길이 */
const MAX_TITLE_LENGTH = 50;
/** 내용 최대 길이 */
const MAX_BODY_LENGTH = 200;
/** 제목 최소 길이 */
const MIN_TITLE_LENGTH = 1;
/** 내용 최소 길이 */
const MIN_BODY_LENGTH = 1;

// 보내기 아이콘 SVG (컴포넌트 외부 상수로 최적화)
const SEND_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface PushNotificationSenderProps {
  readonly hasActiveTokens: boolean;
  readonly isLoading: boolean;
  readonly onSend: (title: string, body: string) => Promise<boolean>;
}

export const PushNotificationSender = memo(function PushNotificationSender({
  hasActiveTokens,
  isLoading,
  onSend,
}: PushNotificationSenderProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleOpenModal = useCallback(() => {
    setTitle('');
    setBody('');
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 입력값 검증
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isTitleValid = trimmedTitle.length >= MIN_TITLE_LENGTH;
  const isBodyValid = trimmedBody.length >= MIN_BODY_LENGTH;
  const isValid = isTitleValid && isBodyValid;

  const handleSend = useCallback(async () => {
    // 중복 방지 및 유효성 재검증
    if (isLoading || !isValid) return;

    const success = await onSend(trimmedTitle, trimmedBody);
    if (success) {
      setIsModalVisible(false);
    }
  }, [isLoading, isValid, trimmedTitle, trimmedBody, onSend]);

  return (
    <>
      <Container>
        <SectionTitle>푸시 알림 발송</SectionTitle>
        <SendButton
          onPress={handleOpenModal}
          activeOpacity={0.7}
          disabled={!hasActiveTokens || isLoading}
          hasActiveTokens={hasActiveTokens}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <SvgXml xml={SEND_ICON_SVG} width={20} height={20} />
              <SendButtonText>개인 푸시 보내기</SendButtonText>
            </>
          )}
        </SendButton>
        {!hasActiveTokens && <DisabledHint>활성 푸시 토큰이 없어 발송할 수 없습니다</DisabledHint>}
      </Container>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <ModalOverlay onPress={handleCloseModal}>
          <ModalContent onPress={(e) => e.stopPropagation()}>
            <ModalTitle>푸시 알림 작성</ModalTitle>

            <InputContainer>
              <InputLabelRow>
                <InputLabel>제목</InputLabel>
                <CharacterCount isNearLimit={title.length > MAX_TITLE_LENGTH * 0.8}>
                  {title.length}/{MAX_TITLE_LENGTH}
                </CharacterCount>
              </InputLabelRow>
              <StyledTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="알림 제목 입력"
                placeholderTextColor={colors.gray03}
                maxLength={MAX_TITLE_LENGTH}
                returnKeyType="next"
              />
            </InputContainer>

            <InputContainer>
              <InputLabelRow>
                <InputLabel>내용</InputLabel>
                <CharacterCount isNearLimit={body.length > MAX_BODY_LENGTH * 0.8}>
                  {body.length}/{MAX_BODY_LENGTH}
                </CharacterCount>
              </InputLabelRow>
              <StyledTextInput
                value={body}
                onChangeText={setBody}
                placeholder="알림 내용 입력"
                placeholderTextColor={colors.gray03}
                multiline
                numberOfLines={3}
                maxLength={MAX_BODY_LENGTH}
                textAlignVertical="top"
              />
            </InputContainer>

            <ButtonRow>
              <CancelButton onPress={handleCloseModal} activeOpacity={0.7}>
                <CancelButtonText>취소</CancelButtonText>
              </CancelButton>
              <ConfirmButton
                onPress={handleSend}
                activeOpacity={0.7}
                disabled={!isValid || isLoading}
                isValid={isValid}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <ConfirmButtonText>발송</ConfirmButtonText>
                )}
              </ConfirmButton>
            </ButtonRow>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
});

/* Styled Components */
const Container = styled(View)({
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.black,
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
});

const SectionTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  marginBottom: 12,
});

interface SendButtonProps {
  hasActiveTokens: boolean;
}

const SendButton = styled(TouchableOpacity)<SendButtonProps>(({ hasActiveTokens }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: hasActiveTokens ? colors.primary : colors.gray05,
  paddingVertical: 14,
  borderRadius: 10,
  gap: 8,
}));

const SendButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
});

const DisabledHint = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  textAlign: 'center',
  marginTop: 8,
});

const ModalOverlay = styled(Pressable)({
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const ModalContent = styled(Pressable)({
  backgroundColor: colors.gray06,
  borderRadius: 16,
  padding: 20,
  width: '100%',
  maxWidth: 400,
});

const ModalTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 20,
  textAlign: 'center',
});

const InputContainer = styled(View)({
  marginBottom: 16,
});

const InputLabelRow = styled(View)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
});

const InputLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray01,
});

interface CharacterCountProps {
  isNearLimit: boolean;
}

const CharacterCount = styled.Text<CharacterCountProps>(({ isNearLimit }) => ({
  ...textStyles.alert2,
  color: isNearLimit ? colors.yellow : colors.gray03,
}));

const StyledTextInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  backgroundColor: colors.gray05,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  minHeight: 44,
});

const ButtonRow = styled(View)({
  flexDirection: 'row',
  gap: 12,
  marginTop: 8,
});

const CancelButton = styled(TouchableOpacity)({
  flex: 1,
  paddingVertical: 14,
  alignItems: 'center',
  backgroundColor: colors.gray05,
  borderRadius: 10,
});

const CancelButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.gray01,
});

interface ConfirmButtonProps {
  isValid: boolean;
}

const ConfirmButton = styled(TouchableOpacity)<ConfirmButtonProps>(({ isValid }) => ({
  flex: 1,
  paddingVertical: 14,
  alignItems: 'center',
  backgroundColor: isValid ? colors.primary : colors.gray04,
  borderRadius: 10,
}));

const ConfirmButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
});
