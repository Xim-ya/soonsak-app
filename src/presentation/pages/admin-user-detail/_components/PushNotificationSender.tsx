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

// 보내기 아이콘 SVG
const sendIconSvg = `
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

  const handleSend = useCallback(async () => {
    if (!title.trim() || !body.trim()) return;

    const success = await onSend(title.trim(), body.trim());
    if (success) {
      setIsModalVisible(false);
    }
  }, [title, body, onSend]);

  const isValid = title.trim().length > 0 && body.trim().length > 0;

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
              <SvgXml xml={sendIconSvg} width={20} height={20} />
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
              <InputLabel>제목</InputLabel>
              <StyledTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="알림 제목 입력"
                placeholderTextColor={colors.gray03}
                maxLength={50}
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>내용</InputLabel>
              <StyledTextInput
                value={body}
                onChangeText={setBody}
                placeholder="알림 내용 입력"
                placeholderTextColor={colors.gray03}
                multiline
                numberOfLines={3}
                maxLength={200}
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

const InputLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray01,
  marginBottom: 8,
});

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
