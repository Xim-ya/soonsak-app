/**
 * BroadcastPushSender - 전체 푸시 발송 컴포넌트
 *
 * 모든 활성 토큰에 푸시를 발송할 수 있는 UI를 제공합니다.
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
  Alert,
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
import { adminPushApi } from '@/features/admin/api/adminPushApi';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import {
  PUSH_CONTENT_SELECTED_EVENT,
  type PushContentSelectResult,
} from '../../admin-push-content-select/_hooks';

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

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidPositiveInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Number.isInteger(num);
}

function isValidNonNegativeInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Number.isInteger(num);
}

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

interface ActionParams {
  contentId?: string;
  contentTitle?: string;
  contentType?: 'movie' | 'tv';
  videoId?: string;
  videoTitle?: string;
  playerContentId?: string;
  playerContentType?: 'movie' | 'tv';
  startSeconds?: string;
  channelId?: string;
  channelName?: string;
  initialTab?: 0 | 1 | 2;
  url?: string;
  refreshTarget?: string;
}

// ============================================================================
// Component
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BroadcastPushSender = memo(function BroadcastPushSender({
  activePushTokens,
  isLoading,
  onSend,
}: BroadcastPushSenderProps) {
  const navigation = useNavigation<NavigationProp>();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedActionKey, setSelectedActionKey] = useState<string>('none');
  const [isActionPickerVisible, setIsActionPickerVisible] = useState(false);
  const [actionParams, setActionParams] = useState<ActionParams>({});

  // 앱 버전 입력 (빈 문자열 = 전체, 값 있으면 해당 버전 필터)
  const [versionInput, setVersionInput] = useState('');
  // 검증된 버전 정보 (확인 버튼 클릭 후 설정)
  const [verifiedVersion, setVerifiedVersion] = useState<{
    version: string | undefined;
    label: string;
    count: number;
  } | null>(null);

  // 콘텐츠 검색 대기 상태
  const [pendingSearchMode, setPendingSearchMode] = useState<'content' | null>(null);

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
        }
        setPendingSearchMode(null);
        // 콘텐츠 선택 후 모달 다시 열기
        setIsModalVisible(true);
      },
    );

    return () => subscription.remove();
  }, [pendingSearchMode]);

  const selectedAction: ActionTypeOption = useMemo(
    () =>
      ACTION_TYPE_OPTIONS.find((opt) => opt.key === selectedActionKey) ?? ACTION_TYPE_OPTIONS[0]!,
    [selectedActionKey],
  );

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isBodyValid = trimmedBody.length >= MIN_BODY_LENGTH;

  const isActionParamsValid = useMemo(() => {
    if (selectedAction.type === 'none') return true;

    if (selectedAction.type === 'navigation') {
      switch (selectedAction.screen) {
        case 'ContentDetail':
          return isValidPositiveInt(actionParams.contentId) && !!actionParams.contentType;
        case 'Player':
          return !!(
            actionParams.videoId &&
            isValidPositiveInt(actionParams.playerContentId) &&
            actionParams.playerContentType &&
            (actionParams.startSeconds === undefined ||
              actionParams.startSeconds === '' ||
              isValidNonNegativeInt(actionParams.startSeconds))
          );
        case 'ChannelDetail':
          return !!actionParams.channelId?.trim();
        case 'Search':
        case 'Settings':
        case 'ReviewFunnel':
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

  const handleOpenModal = useCallback(() => {
    if (activePushTokens === 0) {
      Alert.alert('발송 불가', '활성 푸시 토큰이 없어요');
      return;
    }

    setTitle('');
    setBody('');
    setSelectedActionKey('none');
    setActionParams({});
    setVersionInput('');
    setVerifiedVersion({ version: undefined, label: '전체', count: activePushTokens }); // 기본값: 전체
    setIsModalVisible(true);
  }, [activePushTokens]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
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

  // 콘텐츠 검색 페이지로 이동
  const handleOpenContentSearch = useCallback(() => {
    // 모달을 먼저 닫고 검색 페이지로 이동 (모달 위에 화면이 겹치는 문제 방지)
    setIsModalVisible(false);
    setPendingSearchMode('content');
    // userId 없이 전체 콘텐츠 검색 모드
    navigation.navigate(routePages.adminPushContentSelect, { userId: undefined, mode: 'content' });
  }, [navigation]);

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
        case 'ReviewFunnel':
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

  // 버전 확인 로딩 상태
  const [isVerifying, setIsVerifying] = useState(false);

  // 버전 확인 핸들러 - API 직접 호출
  const handleVerifyVersion = useCallback(async () => {
    let trimmed = versionInput.trim();

    if (!trimmed) {
      // 전체
      setVerifiedVersion({
        version: undefined,
        label: '전체',
        count: activePushTokens,
      });
      return;
    }

    // "v" 접두사 제거 (v1.0.0 -> 1.0.0)
    if (trimmed.toLowerCase().startsWith('v')) {
      trimmed = trimmed.slice(1);
    }

    setIsVerifying(true);
    try {
      // API에서 최신 버전 목록 조회
      const versions = await adminPushApi.getAvailableAppVersions();
      const versionInfo = versions.find((v) => v.version === trimmed);

      setVerifiedVersion({
        version: trimmed,
        label: `v${trimmed}`,
        count: versionInfo?.count ?? 0,
      });
    } catch (error) {
      console.error('[handleVerifyVersion] 버전 조회 실패:', error);
      setVerifiedVersion({
        version: trimmed,
        label: `v${trimmed}`,
        count: 0,
      });
    } finally {
      setIsVerifying(false);
    }
  }, [versionInput, activePushTokens]);

  // 버전 입력이 변경되면 검증 상태 초기화
  const handleVersionInputChange = useCallback((text: string) => {
    setVersionInput(text);
    setVerifiedVersion(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (isLoading || !isValid) return;

    // 버전 검증이 안 되었으면 경고
    if (!verifiedVersion) {
      Alert.alert('버전 확인 필요', '대상 앱 버전을 확인해주세요');
      return;
    }

    // 버전 필터가 있는데 해당 버전의 토큰이 없으면 경고
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
            const pushData = buildPushData();
            const success = await onSend(
              trimmedTitle,
              trimmedBody,
              pushData,
              verifiedVersion.version,
            );
            if (success) {
              setIsModalVisible(false);
            }
          },
        },
      ],
    );
  }, [isLoading, isValid, verifiedVersion, trimmedTitle, trimmedBody, buildPushData, onSend]);

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
                  <SearchButton onPress={handleOpenContentSearch}>
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

        case 'Search':
        case 'Settings':
          return (
            <ParamsContainer>
              <ParamHint>추가 파라미터 없음</ParamHint>
            </ParamsContainer>
          );

        case 'ReviewFunnel':
          return (
            <ParamsContainer>
              <ParamHint>앱 리뷰 적극 유도 퍼널로 이동</ParamHint>
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

  const hasActiveTokens = activePushTokens > 0;

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
                  <WarningText>
                    {verifiedVersion
                      ? `${verifiedVersion.label} (${verifiedVersion.count}개 토큰)`
                      : '버전 미확인'}
                  </WarningText>
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
                    <VerifyButton onPress={handleVerifyVersion} disabled={isVerifying}>
                      {isVerifying ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <VerifyButtonText>확인</VerifyButtonText>
                      )}
                    </VerifyButton>
                  </VersionInputContainer>
                  {verifiedVersion && (
                    <VersionResultContainer isValid={verifiedVersion.count > 0}>
                      <VersionResultText isValid={verifiedVersion.count > 0}>
                        {verifiedVersion.label}: {verifiedVersion.count}개 토큰
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

                {renderParamFields()}

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

const ParamInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  backgroundColor: colors.gray04,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
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
