/**
 * ChannelRegistrationTab - 채널 등록 탭
 *
 * YouTube 채널 URL을 입력받아 채널의 영상을 등록합니다.
 * 최근 영상 또는 전체 영상을 선택할 수 있습니다.
 */

import { memo, useCallback } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { PrimaryButton } from '@/presentation/components/button/PrimaryButton';
import { PosterImage } from '@/presentation/components/image/PosterImage';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { RootStackParamList } from '@/shared/navigation/types';
import type { ChannelRegistrationResult, ChannelRegistrationResultItem } from '@/features/admin';
import type { ChannelRegisterMode } from '../_hooks/useContentRegistration';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const buttonState = isRegistering ? 'loading' : urlInput.trim() ? 'enabled' : 'disabled';

  const handleModeChange = useCallback(
    (mode: ChannelRegisterMode) => {
      onRegisterModeChange(mode);
    },
    [onRegisterModeChange],
  );

  const handleItemPress = useCallback(
    (item: ChannelRegistrationResultItem) => {
      if (!item.contentId || !item.contentType) return;

      const contentType: ContentType = item.contentType === 'movie' ? 'movie' : 'tv';

      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        title: item.contentTitle ?? null,
        type: contentType,
      });
    },
    [navigation],
  );

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 안내 텍스트 */}
        <SectionTitle>YouTube 채널 URL</SectionTitle>
        <Description>
          YouTube 채널 URL을 입력하세요.{'\n'}
          @handle 형식 또는 channel/ID 형식 모두 지원합니다.
        </Description>

        {/* URL 입력 */}
        <UrlInput
          value={urlInput}
          onChangeText={onUrlInputChange}
          placeholder="https://www.youtube.com/@channelname"
          placeholderTextColor={colors.gray03}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isRegistering}
        />

        {/* 등록 모드 선택 */}
        <SectionTitle style={{ marginTop: 24 }}>등록 옵션</SectionTitle>

        <ModeSelector>
          <ModeOption
            isActive={registerMode === 'recent'}
            onPress={() => handleModeChange('recent')}
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
            onPress={() => handleModeChange('all')}
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

        {/* 최근 영상 개수 선택 (recent 모드일 때만) */}
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

        {/* 등록 버튼 */}
        <ButtonContainer>
          <PrimaryButton
            title={registerMode === 'all' ? '전체 영상 등록' : '채널 영상 등록'}
            onPress={onRegister}
            state={buttonState}
          />
        </ButtonContainer>

        {/* 결과 표시 */}
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
                    <ResultValue style={{ color: colors.green }}>{result.registered}개</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>건너뜀</ResultLabel>
                    <ResultValue style={{ color: colors.gray02 }}>{result.skipped}개</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>실패</ResultLabel>
                    <ResultValue style={{ color: colors.red }}>{result.failed}개</ResultValue>
                  </ResultItem>
                </ResultSummary>

                {/* 등록된 영상 목록 */}
                {result.results && result.results.length > 0 && (
                  <ResultDetails>
                    <ResultDetailsTitle>등록된 영상</ResultDetailsTitle>
                    {result.results.slice(0, 10).map((item, index) => {
                      const isClickable = item.contentId && item.contentType;
                      const posterUrl = item.posterPath
                        ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w185 })
                        : '';

                      const content = (
                        <ResultDetailItem key={`${item.videoId}-${index}`}>
                          <PosterContainer>
                            <PosterImage width={48} source={posterUrl} borderRadius={4} />
                          </PosterContainer>
                          <ResultDetailContent>
                            <ResultDetailContentTitle numberOfLines={1}>
                              {item.contentTitle || item.videoTitle}
                            </ResultDetailContentTitle>
                            <ResultDetailVideoTitle numberOfLines={1}>
                              {item.videoTitle}
                            </ResultDetailVideoTitle>
                          </ResultDetailContent>
                          {isClickable && <ChevronText>{'>'}</ChevronText>}
                        </ResultDetailItem>
                      );

                      return isClickable ? (
                        <TouchableOpacity
                          key={`${item.videoId}-${index}`}
                          onPress={() => handleItemPress(item)}
                          activeOpacity={0.7}
                        >
                          {content}
                        </TouchableOpacity>
                      ) : (
                        content
                      );
                    })}
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

const ResultDetailItem = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
});

const PosterContainer = styled.View({
  marginRight: 12,
});

const ResultDetailContent = styled.View({
  flex: 1,
});

const ResultDetailContentTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const ResultDetailVideoTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginTop: 2,
});

const ChevronText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
  marginLeft: 8,
});

const MoreText = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
  marginTop: 8,
  textAlign: 'center',
});

export const ChannelRegistrationTab = memo(ChannelRegistrationTabComponent);
