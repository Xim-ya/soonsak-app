/**
 * ChannelRegistrationTab - 채널 등록 탭
 *
 * YouTube 채널 URL을 입력받아 채널의 영상을 등록합니다.
 * 최근 영상 또는 전체 영상을 선택할 수 있습니다.
 */

import { memo } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { PrimaryButton } from '@/presentation/components/button/PrimaryButton';
import type { ChannelRegistrationResult } from '@/features/admin';
import type { ChannelRegisterMode } from '../_hooks/useContentRegistration';
import { RegistrationResultItem } from './RegistrationResultItem';

interface ChannelRegistrationTabProps {
  readonly urlInput: string;
  readonly onUrlInputChange: (value: string) => void;
  readonly registerMode: ChannelRegisterMode;
  readonly onRegisterModeChange: (mode: ChannelRegisterMode) => void;
  readonly recentVideoCount: number;
  readonly onRecentVideoCountChange: (count: number) => void;
  readonly isRegistering: boolean;
  readonly result: ChannelRegistrationResult | null;
  readonly onRegister: () => void;
}

const VIDEO_COUNT_OPTIONS = [10, 20, 30, 50];

function ChannelRegistrationTabComponent({
  urlInput,
  onUrlInputChange,
  registerMode,
  onRegisterModeChange,
  recentVideoCount,
  onRecentVideoCountChange,
  isRegistering,
  result,
  onRegister,
}: ChannelRegistrationTabProps) {
  const buttonState = isRegistering ? 'loading' : urlInput.trim() ? 'enabled' : 'disabled';

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionTitle>YouTube 채널 URL</SectionTitle>
        <Description>
          YouTube 채널 URL을 입력하세요.{'\n'}
          @handle 형식 또는 channel/ID 형식 모두 지원합니다.
        </Description>

        <UrlInput
          value={urlInput}
          onChangeText={onUrlInputChange}
          placeholder="https://www.youtube.com/@channelname"
          placeholderTextColor={colors.gray03}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isRegistering}
        />

        <OptionSectionTitle>등록 옵션</OptionSectionTitle>

        <ModeSelector>
          <ModeOption
            isActive={registerMode === 'recent'}
            onPress={() => onRegisterModeChange('recent')}
            activeOpacity={0.7}
          >
            <ModeRadio isActive={registerMode === 'recent'}>
              {registerMode === 'recent' && <ModeRadioInner />}
            </ModeRadio>
            <ModeContent>
              <ModeLabel isActive={registerMode === 'recent'}>최근 영상</ModeLabel>
              <ModeDescription>지정한 개수만큼 최근 영상을 등록합니다</ModeDescription>
            </ModeContent>
          </ModeOption>

          <ModeOption
            isActive={registerMode === 'all'}
            onPress={() => onRegisterModeChange('all')}
            activeOpacity={0.7}
          >
            <ModeRadio isActive={registerMode === 'all'}>
              {registerMode === 'all' && <ModeRadioInner />}
            </ModeRadio>
            <ModeContent>
              <ModeLabel isActive={registerMode === 'all'}>전체 영상</ModeLabel>
              <ModeDescription>채널의 모든 영상을 등록합니다 (최대 500개)</ModeDescription>
            </ModeContent>
          </ModeOption>
        </ModeSelector>

        {registerMode === 'recent' && (
          <>
            <SubSectionTitle>등록할 영상 수</SubSectionTitle>
            <CountSelector>
              {VIDEO_COUNT_OPTIONS.map((count) => (
                <CountOption
                  key={count}
                  isActive={recentVideoCount === count}
                  onPress={() => onRecentVideoCountChange(count)}
                  activeOpacity={0.7}
                >
                  <CountText isActive={recentVideoCount === count}>{count}개</CountText>
                </CountOption>
              ))}
            </CountSelector>
          </>
        )}

        <ButtonContainer>
          <PrimaryButton
            title={registerMode === 'all' ? '전체 영상 등록' : '채널 영상 등록'}
            onPress={onRegister}
            state={buttonState}
          />
        </ButtonContainer>

        {result && (
          <ResultContainer>
            <ResultTitle>등록 결과</ResultTitle>

            {result.error ? (
              <ErrorText>{result.error}</ErrorText>
            ) : (
              <>
                <ResultSummary>
                  <ResultItem>
                    <ResultLabel>채널 ID</ResultLabel>
                    <ResultValue numberOfLines={1}>{result.channelId}</ResultValue>
                  </ResultItem>
                </ResultSummary>

                <ResultSummary>
                  {result.totalVideos !== undefined && (
                    <ResultItem>
                      <ResultLabel>전체</ResultLabel>
                      <ResultValue>{result.totalVideos}개</ResultValue>
                    </ResultItem>
                  )}
                  <ResultItem>
                    <ResultLabel>등록</ResultLabel>
                    <SuccessResultValue>{result.registered}개</SuccessResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>건너뜀</ResultLabel>
                    <SkippedResultValue>{result.skipped}개</SkippedResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>실패</ResultLabel>
                    <FailedResultValue>{result.failed}개</FailedResultValue>
                  </ResultItem>
                </ResultSummary>

                {result.results && result.results.length > 0 && (
                  <ResultDetails>
                    <ResultDetailsTitle>등록된 영상</ResultDetailsTitle>
                    {result.results.slice(0, 10).map((item, index) => (
                      <RegistrationResultItem
                        key={`${item.videoId}-${index}`}
                        item={item}
                        index={index}
                      />
                    ))}
                    {result.results.length > 10 && (
                      <MoreText>... 외 {result.results.length - 10}개</MoreText>
                    )}
                  </ResultDetails>
                )}
              </>
            )}
          </ResultContainer>
        )}
      </ScrollView>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
  paddingHorizontal: 16,
});

const SectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 8,
});

const OptionSectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 8,
  marginTop: 24,
});

const SubSectionTitle = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  marginTop: 16,
  marginBottom: 8,
});

const Description = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginBottom: 12,
});

const UrlInput = styled.TextInput({
  backgroundColor: colors.gray06,
  borderRadius: 12,
  padding: 16,
  ...textStyles.body3,
  color: colors.white,
  borderWidth: 1,
  borderColor: colors.gray05,
});

const ModeSelector = styled.View({
  gap: 12,
});

const ModeOption = styled(TouchableOpacity)<{ isActive: boolean }>(({ isActive }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  backgroundColor: isActive ? colors.gray05 : colors.gray06,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: isActive ? colors.primary : colors.gray05,
}));

const ModeRadio = styled.View<{ isActive: boolean }>(({ isActive }) => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: isActive ? colors.primary : colors.gray03,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
}));

const ModeRadioInner = styled.View({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: colors.primary,
});

const ModeContent = styled.View({
  flex: 1,
});

const ModeLabel = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...textStyles.body1,
  color: isActive ? colors.white : colors.gray02,
}));

const ModeDescription = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginTop: 4,
});

const CountSelector = styled.View({
  flexDirection: 'row',
  gap: 8,
});

const CountOption = styled(TouchableOpacity)<{ isActive: boolean }>(({ isActive }) => ({
  flex: 1,
  paddingVertical: 12,
  alignItems: 'center',
  backgroundColor: isActive ? colors.primary : colors.gray06,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: isActive ? colors.primary : colors.gray05,
}));

const CountText = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...textStyles.body3,
  color: isActive ? colors.white : colors.gray02,
}));

const ButtonContainer = styled.View({
  marginTop: 24,
});

const ResultContainer = styled.View({
  marginTop: 24,
  padding: 16,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  marginBottom: 40,
});

const ResultTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 12,
});

const ErrorText = styled.Text({
  ...textStyles.body3,
  color: colors.red,
});

const ResultSummary = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
});

const ResultItem = styled.View({
  alignItems: 'center',
  flex: 1,
});

const ResultLabel = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  marginBottom: 4,
});

const ResultValue = styled.Text({
  ...textStyles.body1,
  color: colors.white,
});

const SuccessResultValue = styled.Text({
  ...textStyles.body1,
  color: colors.green,
});

const SkippedResultValue = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
});

const FailedResultValue = styled.Text({
  ...textStyles.body1,
  color: colors.red,
});

const ResultDetails = styled.View({
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
  paddingTop: 12,
});

const ResultDetailsTitle = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
  marginBottom: 8,
});

const MoreText = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
  marginTop: 8,
  textAlign: 'center',
});

export const ChannelRegistrationTab = memo(ChannelRegistrationTabComponent);
