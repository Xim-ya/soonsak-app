/**
 * PushNotificationSender - 푸시 알림 발송 모달
 *
 * 개인 푸시 알림을 발송할 수 있는 UI를 제공합니다.
 * 딥링크 데이터 설정을 지원합니다.
 */

import { memo, useCallback, useState, useMemo, useEffect } from 'react';
import {
  TouchableOpacity,
  Modal,
  Pressable,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import {
  type PushData,
  type ActionTypeOption,
  ACTION_TYPE_OPTIONS,
  USER_CONTENT_TAB_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from '@/features/admin';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import {
  PUSH_CONTENT_SELECTED_EVENT,
  type PushContentSelectResult,
} from '../../admin-push-content-select/AdminPushContentSelectPage';

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

const SEARCH_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * URL 유효성 검증 (http/https만 허용)
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 양의 정수 문자열 검증
 */
function isValidPositiveInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Number.isInteger(num);
}

/**
 * 음이 아닌 정수 문자열 검증 (0 허용)
 */
function isValidNonNegativeInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Number.isInteger(num);
}

// ============================================================================
// Types
// ============================================================================

interface PushNotificationSenderProps {
  /** 현재 보고 있는 유저 ID (콘텐츠 검색용) */
  readonly userId: string;
  readonly hasActiveTokens: boolean;
  readonly isLoading: boolean;
  readonly onSend: (title: string, body: string, data?: PushData) => Promise<boolean>;
}

interface ActionParams {
  // ContentDetail
  contentId?: string;
  contentTitle?: string;
  contentType?: 'movie' | 'tv';
  // Player
  videoId?: string;
  videoTitle?: string;
  playerContentId?: string;
  playerContentType?: 'movie' | 'tv';
  startSeconds?: string;
  // ChannelDetail
  channelId?: string;
  channelName?: string;
  // UserContentList
  initialTab?: 0 | 1 | 2;
  // OPEN_URL
  url?: string;
  // REFRESH_DATA
  refreshTarget?: string;
}

// ============================================================================
// Component
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PushNotificationSender = memo(function PushNotificationSender({
  userId,
  hasActiveTokens,
  isLoading,
  onSend,
}: PushNotificationSenderProps) {
  const navigation = useNavigation<NavigationProp>();

  // 기본 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // 액션 타입 상태
  const [selectedActionKey, setSelectedActionKey] = useState<string>('none');
  const [isActionPickerVisible, setIsActionPickerVisible] = useState(false);

  // 콘텐츠 검색 대기 상태 ('content' | 'player' | null)
  const [pendingSearchMode, setPendingSearchMode] = useState<'content' | 'player' | null>(null);

  // 액션 파라미터 상태
  const [actionParams, setActionParams] = useState<ActionParams>({});

  // 콘텐츠 선택 이벤트 리스너
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      PUSH_CONTENT_SELECTED_EVENT,
      (result: PushContentSelectResult) => {
        if (pendingSearchMode === 'content') {
          setActionParams((prev) => ({
            ...prev,
            contentId: String(result.contentId),
            contentTitle: result.contentTitle,
            contentType: result.contentType,
          }));
        } else if (pendingSearchMode === 'player' && result.videoId && result.videoTitle) {
          // 타입 가드가 콜백 내부에서 적용되지 않으므로 로컬 변수로 추출
          const videoId = result.videoId;
          const videoTitle = result.videoTitle;
          // 시청기록에서 선택한 경우 startSeconds도 전달됨
          const startSeconds = result.startSeconds;
          setActionParams((prev) => ({
            ...prev,
            playerContentId: String(result.contentId),
            playerContentType: result.contentType,
            videoId,
            videoTitle,
            // 시청기록에서 선택한 경우 이어보기 시작 위치 자동 입력
            ...(startSeconds !== undefined && { startSeconds: String(startSeconds) }),
          }));
        }
        setPendingSearchMode(null);
        // 콘텐츠 선택 후 모달 다시 열기
        setIsModalVisible(true);
      },
    );

    return () => subscription.remove();
  }, [pendingSearchMode]);

  // 선택된 액션 옵션 (항상 존재함을 보장)
  const selectedAction: ActionTypeOption = useMemo(
    () =>
      ACTION_TYPE_OPTIONS.find((opt) => opt.key === selectedActionKey) ?? ACTION_TYPE_OPTIONS[0]!,
    [selectedActionKey],
  );

  // 입력값 검증 (title은 선택적, body는 필수)
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isBodyValid = trimmedBody.length >= MIN_BODY_LENGTH;

  // 액션 파라미터 유효성 검증
  const isActionParamsValid = useMemo(() => {
    if (selectedAction.type === 'none') return true;

    if (selectedAction.type === 'navigation') {
      switch (selectedAction.screen) {
        case 'ContentDetail':
          // contentId는 양의 정수여야 함
          return isValidPositiveInt(actionParams.contentId) && !!actionParams.contentType;
        case 'Player':
          // playerContentId는 양의 정수, startSeconds는 음이 아닌 정수(선택적)
          return !!(
            actionParams.videoId &&
            isValidPositiveInt(actionParams.playerContentId) &&
            actionParams.playerContentType &&
            // startSeconds가 입력된 경우에만 검증
            (actionParams.startSeconds === undefined ||
              actionParams.startSeconds === '' ||
              isValidNonNegativeInt(actionParams.startSeconds))
          );
        case 'ChannelDetail':
          return !!actionParams.channelId?.trim();
        case 'Search':
        case 'Settings':
          return true;
        case 'UserContentList':
          return actionParams.initialTab !== undefined;
        default:
          return true;
      }
    }

    if (selectedAction.type === 'action') {
      switch (selectedAction.action) {
        case 'OPEN_URL': {
          const url = actionParams.url?.trim() ?? '';
          // URL이 비어있거나 유효하지 않으면 false
          return url.length > 0 && isValidUrl(url);
        }
        case 'REFRESH_DATA':
          return !!actionParams.refreshTarget?.trim();
        case 'REQUEST_REVIEW':
        case 'OPEN_SETTINGS':
          return true;
        default:
          return true;
      }
    }

    return true;
  }, [selectedAction, actionParams]);

  const isValid = isBodyValid && isActionParamsValid;

  // 모달 열기
  const handleOpenModal = useCallback(() => {
    setTitle('');
    setBody('');
    setSelectedActionKey('none');
    setActionParams({});
    setIsModalVisible(true);
  }, []);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 액션 타입 변경
  const handleActionChange = useCallback((option: ActionTypeOption) => {
    setSelectedActionKey(option.key);
    setActionParams({});
    setIsActionPickerVisible(false);
  }, []);

  // 파라미터 업데이트
  const updateParam = useCallback(
    <K extends keyof ActionParams>(key: K, value: ActionParams[K]) => {
      setActionParams((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // 콘텐츠 검색 페이지로 이동
  const handleOpenContentSearch = useCallback(
    (mode: 'content' | 'player') => {
      // 모달을 먼저 닫고 검색 페이지로 이동 (모달 위에 화면이 겹치는 문제 방지)
      setIsModalVisible(false);
      setPendingSearchMode(mode);
      navigation.navigate(routePages.adminPushContentSelect, { userId, mode });
    },
    [navigation, userId],
  );

  // PushData 빌드
  const buildPushData = useCallback((): PushData | undefined => {
    if (selectedAction.type === 'none') return undefined;

    if (selectedAction.type === 'navigation' && selectedAction.screen) {
      const screen = selectedAction.screen;
      let params: Record<string, unknown> = {};

      switch (screen) {
        case 'ContentDetail':
          params = {
            id: Number(actionParams.contentId),
            title: actionParams.contentTitle || '',
            type: actionParams.contentType,
          };
          break;
        case 'Player': {
          // startSeconds 검증 및 파싱
          const startSecondsValue = actionParams.startSeconds?.trim();
          const startSeconds =
            startSecondsValue && isValidNonNegativeInt(startSecondsValue)
              ? Number(startSecondsValue)
              : undefined;
          params = {
            videoId: actionParams.videoId,
            title: actionParams.videoTitle || '',
            contentId: Number(actionParams.playerContentId),
            contentType: actionParams.playerContentType,
            ...(startSeconds !== undefined && { startSeconds }),
          };
          break;
        }
        case 'ChannelDetail':
          params = {
            channelId: actionParams.channelId,
            channelName: actionParams.channelName || '',
          };
          break;
        case 'Search':
        case 'Settings':
          params = {};
          break;
        case 'UserContentList':
          params = { initialTab: actionParams.initialTab ?? 0 };
          break;
      }

      return {
        version: '1.0',
        action: {
          type: 'NAVIGATION',
          screen,
          params,
        },
      } as PushData;
    }

    if (selectedAction.type === 'action' && selectedAction.action) {
      const action = selectedAction.action;

      if (action === 'OPEN_URL') {
        return {
          version: '1.0',
          action: {
            type: 'ACTION',
            action: 'OPEN_URL',
            payload: { url: actionParams.url?.trim() || '' },
          },
        } as PushData;
      }

      if (action === 'REFRESH_DATA') {
        return {
          version: '1.0',
          action: {
            type: 'ACTION',
            action: 'REFRESH_DATA',
            payload: { target: actionParams.refreshTarget?.trim() || '' },
          },
        } as PushData;
      }

      return {
        version: '1.0',
        action: {
          type: 'ACTION',
          action,
        },
      } as PushData;
    }

    return undefined;
  }, [selectedAction, actionParams]);

  // 발송
  const handleSend = useCallback(async () => {
    if (isLoading || !isValid) return;

    const pushData = buildPushData();
    const success = await onSend(trimmedTitle, trimmedBody, pushData);
    if (success) {
      setIsModalVisible(false);
    }
  }, [isLoading, isValid, trimmedTitle, trimmedBody, buildPushData, onSend]);

  // 파라미터 입력 필드 렌더링
  const renderParamFields = () => {
    if (selectedAction.type === 'none') return null;

    if (selectedAction.type === 'navigation') {
      switch (selectedAction.screen) {
        case 'ContentDetail':
          return (
            <ParamsContainer>
              <ParamRow>
                <ParamInputRow>
                  <ParamInputFlex
                    value={actionParams.contentId ?? ''}
                    onChangeText={(v) => updateParam('contentId', v)}
                    placeholder="콘텐츠 ID (숫자)"
                    placeholderTextColor={colors.gray03}
                    keyboardType="numeric"
                  />
                  <SearchButton onPress={() => handleOpenContentSearch('content')}>
                    <SvgXml xml={SEARCH_ICON_SVG} width={16} height={16} />
                  </SearchButton>
                </ParamInputRow>
              </ParamRow>
              {actionParams.contentId && (
                <ParamRow>
                  <ParamInput
                    value={actionParams.contentTitle ?? ''}
                    onChangeText={(v) => updateParam('contentTitle', v)}
                    placeholder="콘텐츠 제목 (선택)"
                    placeholderTextColor={colors.gray03}
                  />
                </ParamRow>
              )}
              <ParamRow>
                <SegmentContainer>
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <SegmentButton
                      key={opt.value}
                      isSelected={actionParams.contentType === opt.value}
                      onPress={() => updateParam('contentType', opt.value)}
                    >
                      <SegmentText isSelected={actionParams.contentType === opt.value}>
                        {opt.label}
                      </SegmentText>
                    </SegmentButton>
                  ))}
                </SegmentContainer>
              </ParamRow>
            </ParamsContainer>
          );

        case 'Player':
          return (
            <ParamsContainer>
              <ParamRow>
                <ParamInputRow>
                  <ParamInputFlex
                    value={actionParams.videoId ?? ''}
                    onChangeText={(v) => updateParam('videoId', v)}
                    placeholder="콘텐츠 검색으로 비디오 선택"
                    placeholderTextColor={colors.gray03}
                    editable={false}
                  />
                  <SearchButton onPress={() => handleOpenContentSearch('player')}>
                    <SvgXml xml={SEARCH_ICON_SVG} width={16} height={16} />
                  </SearchButton>
                </ParamInputRow>
              </ParamRow>
              {actionParams.videoId && (
                <>
                  <ParamRow>
                    <ParamDisplayRow>
                      <ParamDisplayLabel>비디오:</ParamDisplayLabel>
                      <ParamDisplayValue numberOfLines={1}>
                        {actionParams.videoTitle || actionParams.videoId}
                      </ParamDisplayValue>
                    </ParamDisplayRow>
                  </ParamRow>
                  <ParamRow>
                    <ParamDisplayRow>
                      <ParamDisplayLabel>콘텐츠:</ParamDisplayLabel>
                      <ParamDisplayValue numberOfLines={1}>
                        {actionParams.playerContentId} ({actionParams.playerContentType})
                      </ParamDisplayValue>
                    </ParamDisplayRow>
                  </ParamRow>
                  <ParamRow>
                    <ParamInput
                      value={actionParams.startSeconds ?? ''}
                      onChangeText={(v) => updateParam('startSeconds', v)}
                      placeholder="시작 위치 (초, 선택)"
                      placeholderTextColor={colors.gray03}
                      keyboardType="numeric"
                    />
                  </ParamRow>
                </>
              )}
            </ParamsContainer>
          );

        case 'ChannelDetail':
          return (
            <ParamsContainer>
              <ParamRow>
                <ParamInput
                  value={actionParams.channelId ?? ''}
                  onChangeText={(v) => updateParam('channelId', v)}
                  placeholder="YouTube Channel ID"
                  placeholderTextColor={colors.gray03}
                />
              </ParamRow>
              <ParamRow>
                <ParamInput
                  value={actionParams.channelName ?? ''}
                  onChangeText={(v) => updateParam('channelName', v)}
                  placeholder="채널 이름 (선택)"
                  placeholderTextColor={colors.gray03}
                />
              </ParamRow>
            </ParamsContainer>
          );

        case 'UserContentList':
          return (
            <ParamsContainer>
              <ParamLabel>이동할 탭</ParamLabel>
              <SegmentContainer>
                {USER_CONTENT_TAB_OPTIONS.map((opt) => (
                  <SegmentButton
                    key={opt.value}
                    isSelected={actionParams.initialTab === opt.value}
                    onPress={() => updateParam('initialTab', opt.value)}
                  >
                    <SegmentText isSelected={actionParams.initialTab === opt.value}>
                      {opt.label}
                    </SegmentText>
                  </SegmentButton>
                ))}
              </SegmentContainer>
            </ParamsContainer>
          );

        case 'Search':
        case 'Settings':
          return (
            <ParamsContainer>
              <ParamHint>추가 파라미터 없음</ParamHint>
            </ParamsContainer>
          );

        default:
          return null;
      }
    }

    if (selectedAction.type === 'action') {
      switch (selectedAction.action) {
        case 'OPEN_URL':
          return (
            <ParamsContainer>
              <ParamRow>
                <ParamInput
                  value={actionParams.url ?? ''}
                  onChangeText={(v) => updateParam('url', v)}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.gray03}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </ParamRow>
            </ParamsContainer>
          );

        case 'REFRESH_DATA':
          return (
            <ParamsContainer>
              <ParamRow>
                <ParamInput
                  value={actionParams.refreshTarget ?? ''}
                  onChangeText={(v) => updateParam('refreshTarget', v)}
                  placeholder="새로고침 대상 (예: home)"
                  placeholderTextColor={colors.gray03}
                />
              </ParamRow>
            </ParamsContainer>
          );

        case 'REQUEST_REVIEW':
        case 'OPEN_SETTINGS':
          return (
            <ParamsContainer>
              <ParamHint>추가 파라미터 없음</ParamHint>
            </ParamsContainer>
          );

        default:
          return null;
      }
    }

    return null;
  };

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
            {/* 액션 Picker 뷰 */}
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
                <PickerScrollView
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
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
              /* 메인 푸시 작성 뷰 */
              <ModalScrollView showsVerticalScrollIndicator={false}>
                <ModalTitle>푸시 알림 작성</ModalTitle>

                {/* 제목 (선택) */}
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

                {/* 내용 */}
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

                {/* 액션 타입 선택 */}
                <InputContainer>
                  <InputLabel>딥링크 액션 (선택)</InputLabel>
                  <ActionSelector onPress={() => setIsActionPickerVisible(true)}>
                    <ActionSelectorText hasValue={selectedAction.type !== 'none'}>
                      {selectedAction.label}
                    </ActionSelectorText>
                    <SvgXml xml={CHEVRON_DOWN_SVG} width={16} height={16} />
                  </ActionSelector>
                </InputContainer>

                {/* 액션 파라미터 */}
                {renderParamFields()}

                {/* 버튼 */}
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

const ParamsContainer = styled(View)({
  backgroundColor: colors.gray05,
  borderRadius: 10,
  padding: 12,
  marginBottom: 16,
});

const ParamRow = styled(View)({
  marginBottom: 10,
});

const ParamInputRow = styled(View)({
  flexDirection: 'row',
  gap: 8,
});

const ParamInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  backgroundColor: colors.gray04,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
});

const ParamInputFlex = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  backgroundColor: colors.gray04,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  flex: 1,
});

const SearchButton = styled(TouchableOpacity)({
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingHorizontal: 14,
  justifyContent: 'center',
  alignItems: 'center',
});

const ParamDisplayRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray04,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  gap: 8,
});

const ParamDisplayLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const ParamDisplayValue = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  flex: 1,
});

const ParamLabel = styled.Text({
  ...textStyles.alert1,
  color: colors.gray02,
  marginBottom: 8,
});

const ParamHint = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  textAlign: 'center',
});

const SegmentContainer = styled(View)({
  flexDirection: 'row',
  gap: 8,
});

interface SegmentButtonProps {
  isSelected: boolean;
}

const SegmentButton = styled(TouchableOpacity)<SegmentButtonProps>(({ isSelected }) => ({
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  backgroundColor: isSelected ? colors.primary : colors.gray04,
  borderRadius: 8,
}));

const SegmentText = styled.Text<SegmentButtonProps>(({ isSelected }) => ({
  ...textStyles.body2,
  color: isSelected ? colors.white : colors.gray02,
  fontWeight: isSelected ? '600' : '400',
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

// Picker Styles (메인 모달 내부 뷰)
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
