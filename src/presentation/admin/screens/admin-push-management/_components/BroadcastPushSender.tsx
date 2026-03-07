/**
 * BroadcastPushSender - 전체 푸시 발송 컴포넌트
 *
 * 모든 활성 토큰에 푸시를 발송할 수 있는 UI를 제공합니다.
 *
 * 리팩토링 포인트:
 * - useVersionVerification 훅으로 버전 검증 로직 분리
 * - ActionParamFields 컴포넌트로 파라미터 입력 UI 분리
 * - validateActionParams, buildPushData로 유효성 검사 및 데이터 빌드 로직 분리
 * - DeviceEventEmitter useRef 패턴으로 메모리 누수 방지
 */

import { memo, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Modal,
  Pressable,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import type { EmitterSubscription } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { PushData, ActionTypeOption } from '@/features/admin';
import { ACTION_TYPE_OPTIONS } from '@/features/admin';
import { routePages } from '@/presentation/navigation/constant/routePages';
import type { RootStackParamList } from '@/presentation/navigation/types';
import {
  PUSH_CONTENT_SELECTED_EVENT,
  type PushContentSelectResult,
} from '../../admin-push-content-select/_hooks';
import { useVersionVerification, type VerificationState } from '../_hooks';
import { validateActionParams, buildPushData, type ActionParams } from '../_utils';
import { ActionParamFields } from './ActionParamFields';

// ============================================================================
// Constants
// ============================================================================

const MAX_TITLE_LENGTH = 50;
const MAX_BODY_LENGTH = 200;
const MIN_BODY_LENGTH = 1;

const SEND_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const CHEVRON_DOWN_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 9L12 15L18 9" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// ============================================================================
// Types
// ============================================================================

interface BroadcastPushSenderProps {
  readonly activePushTokens: number;
  readonly isLoading: boolean;
  readonly onSend: (
    title: string,
    body: string,
    data?: PushData,
    appVersion?: string | null,
  ) => Promise<boolean>;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================================
// Helper Functions
// ============================================================================

/** 검증 상태에서 표시 텍스트 추출 */
function getVerificationDisplayText(state: VerificationState): string {
  switch (state.status) {
    case 'unverified':
      return '버전 미확인';
    case 'verifying':
      return '확인 중...';
    case 'verified':
      return `${state.label} (${state.count}개 토큰)`;
    case 'error':
      return `${state.label} (조회 실패)`;
  }
}

// ============================================================================
// Component
// ============================================================================

export const BroadcastPushSender = memo(function BroadcastPushSender({
  activePushTokens,
  isLoading,
  onSend,
}: BroadcastPushSenderProps) {
  const navigation = useNavigation<NavigationProp>();

  // Modal & Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedActionKey, setSelectedActionKey] = useState<string>('none');
  const [isActionPickerVisible, setIsActionPickerVisible] = useState(false);
  const [actionParams, setActionParams] = useState<ActionParams>({});

  // Version Verification Hook
  const {
    versionInput,
    verificationState,
    handleInputChange: handleVersionInputChange,
    verifyVersion,
    isVerified,
    isVerifying,
    hasValidTokens,
    getVerifiedVersion,
    reset: resetVersionVerification,
  } = useVersionVerification({ totalActiveTokens: activePushTokens });

  // 콘텐츠 검색 대기 상태 (useRef로 최신 상태 참조)
  const pendingSearchModeRef = useRef<'content' | null>(null);
  const [pendingSearchMode, setPendingSearchMode] = useState<'content' | null>(null);

  // pendingSearchMode 동기화
  useEffect(() => {
    pendingSearchModeRef.current = pendingSearchMode;
  }, [pendingSearchMode]);

  // 콘텐츠 선택 이벤트 리스너 (useRef 패턴으로 메모리 누수 방지)
  useEffect(() => {
    const subscription: EmitterSubscription = DeviceEventEmitter.addListener(
      PUSH_CONTENT_SELECTED_EVENT,
      (result: PushContentSelectResult) => {
        if (pendingSearchModeRef.current === 'content') {
          setActionParams((prev) => ({
            ...prev,
            contentId: String(result.contentId),
            contentTitle: result.contentTitle,
            contentType: result.contentType,
          }));
        }
        setPendingSearchMode(null);
        setIsModalVisible(true);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Derived State
  const selectedAction: ActionTypeOption = useMemo(
    () =>
      ACTION_TYPE_OPTIONS.find((opt) => opt.key === selectedActionKey) ?? ACTION_TYPE_OPTIONS[0]!,
    [selectedActionKey],
  );

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isBodyValid = trimmedBody.length >= MIN_BODY_LENGTH;
  const isActionParamsValid = validateActionParams(selectedAction, actionParams);
  const isFormValid = isBodyValid && isActionParamsValid;

  // Handlers
  const handleOpenModal = useCallback(() => {
    if (activePushTokens === 0) {
      Alert.alert('발송 불가', '활성 푸시 토큰이 없어요');
      return;
    }

    setTitle('');
    setBody('');
    setSelectedActionKey('none');
    setActionParams({});
    setIsActionPickerVisible(false);
    resetVersionVerification(activePushTokens);
    setIsModalVisible(true);
  }, [activePushTokens, resetVersionVerification]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setIsActionPickerVisible(false);
  }, []);

  const handleActionChange = useCallback((option: ActionTypeOption) => {
    setSelectedActionKey(option.key);
    setActionParams({});
    setIsActionPickerVisible(false);
  }, []);

  const updateParam = useCallback(
    <K extends keyof ActionParams>(key: K, value: ActionParams[K]) => {
      setActionParams((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleOpenContentSearch = useCallback(() => {
    setIsModalVisible(false);
    setPendingSearchMode('content');
    navigation.navigate(routePages.adminPushContentSelect, { userId: undefined, mode: 'content' });
  }, [navigation]);

  const handleSend = useCallback(async () => {
    if (isLoading || !isFormValid) return;

    if (!isVerified) {
      Alert.alert('버전 확인 필요', '대상 앱 버전을 확인해주세요');
      return;
    }

    if (!hasValidTokens) {
      Alert.alert('발송 불가', '대상 토큰이 없어요');
      return;
    }

    const verifiedVersion = getVerifiedVersion();
    if (!verifiedVersion) return;

    if (verifiedVersion.version && verifiedVersion.count === 0) {
      Alert.alert('발송 불가', `${verifiedVersion.label} 버전의 활성 토큰이 없어요`);
      return;
    }

    Alert.alert(
      '푸시 발송',
      `${verifiedVersion.label} (${verifiedVersion.count}개 토큰)에 푸시를 발송합니다.\n정말 발송할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '발송',
          style: 'destructive',
          onPress: async () => {
            try {
              const pushData = buildPushData(selectedAction, actionParams);
              const success = await onSend(
                trimmedTitle,
                trimmedBody,
                pushData,
                verifiedVersion.version,
              );
              if (success) {
                setIsModalVisible(false);
              }
            } catch {
              Alert.alert('발송 실패', '푸시 발송 중 오류가 발생했어요');
            }
          },
        },
      ],
    );
  }, [
    isLoading,
    isFormValid,
    isVerified,
    hasValidTokens,
    getVerifiedVersion,
    selectedAction,
    actionParams,
    trimmedTitle,
    trimmedBody,
    onSend,
  ]);

  const hasActiveTokens = activePushTokens > 0;
  const displayText = getVerificationDisplayText(verificationState);

  return (
    <>
      <Container>
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
              <SendButtonText>전체 푸시 보내기</SendButtonText>
            </>
          )}
        </SendButton>
        <TokenCountText>활성 토큰: {activePushTokens}개</TokenCountText>
      </Container>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <ModalOverlay onPress={handleCloseModal}>
          <ModalContent onPress={(e) => e.stopPropagation()}>
            {isActionPickerVisible ? (
              <PickerContainer>
                <PickerHeader>
                  <PickerBackButton onPress={() => setIsActionPickerVisible(false)}>
                    <SvgXml
                      xml={CHEVRON_DOWN_SVG}
                      width={20}
                      height={20}
                      style={{ transform: [{ rotate: '90deg' }] }}
                    />
                  </PickerBackButton>
                  <PickerTitle>딥링크 액션 선택</PickerTitle>
                  <PickerHeaderSpacer />
                </PickerHeader>
                <PickerScrollView showsVerticalScrollIndicator nestedScrollEnabled>
                  {ACTION_TYPE_OPTIONS.map((option) => (
                    <PickerItem
                      key={option.key}
                      isSelected={option.key === selectedActionKey}
                      onPress={() => handleActionChange(option)}
                    >
                      <PickerItemText isSelected={option.key === selectedActionKey}>
                        {option.label}
                      </PickerItemText>
                    </PickerItem>
                  ))}
                </PickerScrollView>
              </PickerContainer>
            ) : (
              <ModalScrollView showsVerticalScrollIndicator={false}>
                <ModalTitle>푸시 발송</ModalTitle>
                <WarningBadge>
                  <WarningText>{displayText}</WarningText>
                </WarningBadge>

                <InputContainer>
                  <InputLabelRow>
                    <InputLabel>제목 (선택)</InputLabel>
                    <CharacterCount isNearLimit={title.length > MAX_TITLE_LENGTH * 0.8}>
                      {title.length}/{MAX_TITLE_LENGTH}
                    </CharacterCount>
                  </InputLabelRow>
                  <StyledTextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="없으면 앱 이름으로 표시"
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

                <InputContainer>
                  <InputLabel>대상 앱 버전</InputLabel>
                  <VersionInputContainer>
                    <VersionInput
                      value={versionInput}
                      onChangeText={handleVersionInputChange}
                      placeholder="비워두면 전체 (예: 1.0.4)"
                      placeholderTextColor={colors.gray03}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <VerifyButton onPress={verifyVersion} disabled={isVerifying}>
                      {isVerifying ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <VerifyButtonText>확인</VerifyButtonText>
                      )}
                    </VerifyButton>
                  </VersionInputContainer>
                  {verificationState.status === 'verified' && (
                    <VersionResultContainer isValid={verificationState.count > 0}>
                      <VersionResultText isValid={verificationState.count > 0}>
                        {verificationState.label}: {verificationState.count}개 토큰
                      </VersionResultText>
                    </VersionResultContainer>
                  )}
                  {verificationState.status === 'error' && (
                    <VersionResultContainer isValid={false}>
                      <VersionResultText isValid={false}>
                        {verificationState.message}
                      </VersionResultText>
                    </VersionResultContainer>
                  )}
                </InputContainer>

                <InputContainer>
                  <InputLabel>딥링크 액션 (선택)</InputLabel>
                  <ActionSelector onPress={() => setIsActionPickerVisible(true)}>
                    <ActionSelectorText hasValue={selectedAction.type !== 'none'}>
                      {selectedAction.label}
                    </ActionSelectorText>
                    <SvgXml xml={CHEVRON_DOWN_SVG} width={16} height={16} />
                  </ActionSelector>
                </InputContainer>

                <ActionParamFields
                  selectedAction={selectedAction}
                  params={actionParams}
                  onUpdateParam={updateParam}
                  onOpenContentSearch={handleOpenContentSearch}
                />

                <ButtonRow>
                  <CancelButton onPress={handleCloseModal} activeOpacity={0.7}>
                    <CancelButtonText>취소</CancelButtonText>
                  </CancelButton>
                  <ConfirmButton
                    onPress={handleSend}
                    activeOpacity={0.7}
                    disabled={!isFormValid || isLoading}
                    isValid={isFormValid}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <ConfirmButtonText>발송</ConfirmButtonText>
                    )}
                  </ConfirmButton>
                </ButtonRow>
              </ModalScrollView>
            )}
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
});

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(View)({
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.black,
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

const TokenCountText = styled.Text({
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
  width: '100%',
  maxWidth: 400,
  maxHeight: '80%',
  minHeight: 300,
});

const ModalScrollView = styled(ScrollView)({
  padding: 20,
});

const ModalTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 8,
  textAlign: 'center',
});

const WarningBadge = styled(View)({
  backgroundColor: colors.yellow,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  alignSelf: 'center',
  marginBottom: 20,
});

const WarningText = styled.Text({
  ...textStyles.alert2,
  color: colors.black,
  fontWeight: '600',
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

const VersionInputContainer = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  borderRadius: 10,
  marginTop: 8,
});

const VersionInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  flex: 1,
  paddingHorizontal: 14,
  paddingVertical: 12,
  minHeight: 44,
});

const VerifyButton = styled(TouchableOpacity)({
  backgroundColor: colors.gray04,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
  marginRight: 8,
});

const VerifyButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

interface VersionResultProps {
  isValid: boolean;
}

const VersionResultContainer = styled(View)<VersionResultProps>(({ isValid }) => ({
  marginTop: 8,
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: isValid ? `${colors.primary}20` : `${colors.red}20`,
  borderRadius: 6,
  alignSelf: 'flex-start',
}));

const VersionResultText = styled.Text<VersionResultProps>(({ isValid }) => ({
  ...textStyles.alert2,
  color: isValid ? colors.primary : colors.red,
  fontWeight: '600',
}));

const ActionSelector = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.gray05,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  marginTop: 8,
});

interface ActionSelectorTextProps {
  hasValue: boolean;
}

const ActionSelectorText = styled.Text<ActionSelectorTextProps>(({ hasValue }) => ({
  ...textStyles.body2,
  color: hasValue ? colors.white : colors.gray03,
}));

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

const PickerContainer = styled(View)({
  flexGrow: 1,
  flexShrink: 1,
  padding: 20,
  minHeight: 250,
});

const PickerHeader = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
});

const PickerBackButton = styled(TouchableOpacity)({
  padding: 4,
});

const PickerHeaderSpacer = styled(View)({
  width: 28,
});

const PickerTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  textAlign: 'center',
  flex: 1,
});

const PickerScrollView = styled(ScrollView)({
  flexGrow: 1,
  flexShrink: 1,
});

interface PickerItemProps {
  isSelected: boolean;
}

const PickerItem = styled(TouchableOpacity)<PickerItemProps>(({ isSelected }) => ({
  paddingVertical: 14,
  paddingHorizontal: 16,
  backgroundColor: isSelected ? colors.primary : colors.gray05,
  borderRadius: 8,
  marginBottom: 8,
}));

const PickerItemText = styled.Text<PickerItemProps>(({ isSelected }) => ({
  ...textStyles.body1,
  color: isSelected ? colors.white : colors.gray01,
}));
