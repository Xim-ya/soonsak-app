/**
 * ActionParamFields - 액션 파라미터 입력 필드
 *
 * 선택된 액션 타입에 따라 적절한 입력 필드를 렌더링합니다.
 */

import { memo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import {
  type ActionTypeOption,
  USER_CONTENT_TAB_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from '@/features/admin';
import type { ActionParams } from '../_utils/actionValidators';

// ============================================================================
// Constants
// ============================================================================

const SEARCH_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// ============================================================================
// Types
// ============================================================================

interface ActionParamFieldsProps {
  readonly selectedAction: ActionTypeOption;
  readonly params: ActionParams;
  readonly onUpdateParam: <K extends keyof ActionParams>(key: K, value: ActionParams[K]) => void;
  readonly onOpenContentSearch: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

interface ContentDetailFieldsProps {
  params: ActionParams;
  onUpdateParam: ActionParamFieldsProps['onUpdateParam'];
  onOpenContentSearch: () => void;
}

const ContentDetailFields = memo(function ContentDetailFields({
  params,
  onUpdateParam,
  onOpenContentSearch,
}: ContentDetailFieldsProps) {
  return (
    <ParamsContainer>
      <ParamRow>
        <ParamInputRow>
          <ParamInputFlex
            value={params.contentId ?? ''}
            onChangeText={(v) => onUpdateParam('contentId', v)}
            placeholder="콘텐츠 ID (숫자)"
            placeholderTextColor={colors.gray03}
            keyboardType="numeric"
          />
          <SearchButton onPress={onOpenContentSearch}>
            <SvgXml xml={SEARCH_ICON_SVG} width={16} height={16} />
          </SearchButton>
        </ParamInputRow>
      </ParamRow>
      {params.contentId && (
        <ParamRow>
          <ParamInput
            value={params.contentTitle ?? ''}
            onChangeText={(v) => onUpdateParam('contentTitle', v)}
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
              isSelected={params.contentType === opt.value}
              onPress={() => onUpdateParam('contentType', opt.value)}
            >
              <SegmentText isSelected={params.contentType === opt.value}>
                {opt.label}
              </SegmentText>
            </SegmentButton>
          ))}
        </SegmentContainer>
      </ParamRow>
    </ParamsContainer>
  );
});

interface UserContentListFieldsProps {
  params: ActionParams;
  onUpdateParam: ActionParamFieldsProps['onUpdateParam'];
}

const UserContentListFields = memo(function UserContentListFields({
  params,
  onUpdateParam,
}: UserContentListFieldsProps) {
  return (
    <ParamsContainer>
      <ParamLabel>이동할 탭</ParamLabel>
      <SegmentContainer>
        {USER_CONTENT_TAB_OPTIONS.map((opt) => (
          <SegmentButton
            key={opt.value}
            isSelected={params.initialTab === opt.value}
            onPress={() => onUpdateParam('initialTab', opt.value)}
          >
            <SegmentText isSelected={params.initialTab === opt.value}>
              {opt.label}
            </SegmentText>
          </SegmentButton>
        ))}
      </SegmentContainer>
    </ParamsContainer>
  );
});

interface ChannelDetailFieldsProps {
  params: ActionParams;
  onUpdateParam: ActionParamFieldsProps['onUpdateParam'];
}

const ChannelDetailFields = memo(function ChannelDetailFields({
  params,
  onUpdateParam,
}: ChannelDetailFieldsProps) {
  return (
    <ParamsContainer>
      <ParamRow>
        <ParamInput
          value={params.channelId ?? ''}
          onChangeText={(v) => onUpdateParam('channelId', v)}
          placeholder="YouTube Channel ID"
          placeholderTextColor={colors.gray03}
        />
      </ParamRow>
      <ParamRow>
        <ParamInput
          value={params.channelName ?? ''}
          onChangeText={(v) => onUpdateParam('channelName', v)}
          placeholder="채널 이름 (선택)"
          placeholderTextColor={colors.gray03}
        />
      </ParamRow>
    </ParamsContainer>
  );
});

interface UrlFieldsProps {
  params: ActionParams;
  onUpdateParam: ActionParamFieldsProps['onUpdateParam'];
}

const UrlFields = memo(function UrlFields({ params, onUpdateParam }: UrlFieldsProps) {
  return (
    <ParamsContainer>
      <ParamRow>
        <ParamInput
          value={params.url ?? ''}
          onChangeText={(v) => onUpdateParam('url', v)}
          placeholder="https://example.com"
          placeholderTextColor={colors.gray03}
          keyboardType="url"
          autoCapitalize="none"
        />
      </ParamRow>
    </ParamsContainer>
  );
});

interface RefreshDataFieldsProps {
  params: ActionParams;
  onUpdateParam: ActionParamFieldsProps['onUpdateParam'];
}

const RefreshDataFields = memo(function RefreshDataFields({
  params,
  onUpdateParam,
}: RefreshDataFieldsProps) {
  return (
    <ParamsContainer>
      <ParamRow>
        <ParamInput
          value={params.refreshTarget ?? ''}
          onChangeText={(v) => onUpdateParam('refreshTarget', v)}
          placeholder="새로고침 대상 (예: home)"
          placeholderTextColor={colors.gray03}
        />
      </ParamRow>
    </ParamsContainer>
  );
});

const NoParamsHint = memo(function NoParamsHint({ hint }: { hint: string }) {
  return (
    <ParamsContainer>
      <ParamHint>{hint}</ParamHint>
    </ParamsContainer>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export const ActionParamFields = memo(function ActionParamFields({
  selectedAction,
  params,
  onUpdateParam,
  onOpenContentSearch,
}: ActionParamFieldsProps) {
  if (selectedAction.type === 'none') {
    return null;
  }

  // Navigation 타입
  if (selectedAction.type === 'navigation') {
    switch (selectedAction.screen) {
      case 'ContentDetail':
        return (
          <ContentDetailFields
            params={params}
            onUpdateParam={onUpdateParam}
            onOpenContentSearch={onOpenContentSearch}
          />
        );
      case 'UserContentList':
        return <UserContentListFields params={params} onUpdateParam={onUpdateParam} />;
      case 'ChannelDetail':
        return <ChannelDetailFields params={params} onUpdateParam={onUpdateParam} />;
      case 'Search':
      case 'Settings':
        return <NoParamsHint hint="추가 파라미터 없음" />;
      case 'ReviewFunnel':
        return <NoParamsHint hint="앱 리뷰 적극 유도 퍼널로 이동" />;
      default:
        return null;
    }
  }

  // Action 타입
  if (selectedAction.type === 'action') {
    switch (selectedAction.action) {
      case 'OPEN_URL':
        return <UrlFields params={params} onUpdateParam={onUpdateParam} />;
      case 'REFRESH_DATA':
        return <RefreshDataFields params={params} onUpdateParam={onUpdateParam} />;
      case 'REQUEST_REVIEW':
      case 'OPEN_SETTINGS':
        return <NoParamsHint hint="추가 파라미터 없음" />;
      default:
        return null;
    }
  }

  return null;
});

// ============================================================================
// Styled Components
// ============================================================================

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
