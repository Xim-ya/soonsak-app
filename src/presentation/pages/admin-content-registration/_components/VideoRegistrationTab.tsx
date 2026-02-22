/**
 * VideoRegistrationTab - 영상 등록 탭
 *
 * YouTube 영상 URL을 입력받아 등록합니다.
 * 여러 URL을 줄바꿈 또는 쉼표로 구분하여 일괄 입력할 수 있습니다.
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
import type { BatchRegistrationResult, BatchRegistrationResultItem } from '@/features/admin';

interface VideoRegistrationTabProps {
  readonly urlInput: string;
  readonly onUrlInputChange: (value: string) => void;
  readonly isRegistering: boolean;
  readonly progress: { current: number; total: number } | null;
  readonly result: BatchRegistrationResult | null;
  readonly onRegister: () => void;
}

function VideoRegistrationTabComponent({
  urlInput,
  onUrlInputChange,
  isRegistering,
  progress,
  result,
  onRegister,
}: VideoRegistrationTabProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const buttonState = isRegistering ? 'loading' : urlInput.trim() ? 'enabled' : 'disabled';

  const handleItemPress = useCallback(
    (item: BatchRegistrationResultItem) => {
      if (!item.success || !item.contentId || !item.contentType) return;

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
        <SectionTitle>YouTube 영상 URL</SectionTitle>
        <Description>
          YouTube 영상 URL을 입력하세요.{'\n'}
          여러 URL은 줄바꿈 또는 쉼표로 구분합니다.
        </Description>

        {/* URL 입력 */}
        <UrlInput
          value={urlInput}
          onChangeText={onUrlInputChange}
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor={colors.gray03}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isRegistering}
        />

        {/* 진행 상태 */}
        {progress && (
          <ProgressContainer>
            <ProgressText>
              등록 중... ({progress.current}/{progress.total})
            </ProgressText>
            <ProgressBar>
              <ProgressFill width={(progress.current / progress.total) * 100} />
            </ProgressBar>
          </ProgressContainer>
        )}

        {/* 등록 버튼 */}
        <ButtonContainer>
          <PrimaryButton title="영상 등록" onPress={onRegister} state={buttonState} />
        </ButtonContainer>

        {/* 결과 표시 */}
        {result && (
          <ResultContainer>
            <ResultTitle>등록 결과</ResultTitle>
            <ResultSummary>
              <ResultItem>
                <ResultLabel>전체</ResultLabel>
                <ResultValue>{result.total}개</ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>성공</ResultLabel>
                <ResultValue style={{ color: colors.green }}>{result.success}개</ResultValue>
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

            {/* 상세 결과 */}
            {result.results.length > 0 && (
              <ResultDetails>
                {result.results.map((item, index) => {
                  const isClickable = item.success && item.contentId && item.contentType;
                  const posterUrl = item.posterPath
                    ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w185 })
                    : '';

                  const content = (
                    <ResultDetailItem key={`${item.videoId}-${index}`}>
                      {item.success && (
                        <PosterContainer>
                          <PosterImage width={48} source={posterUrl} borderRadius={4} />
                        </PosterContainer>
                      )}
                      {!item.success && (
                        <ResultDetailIcon success={false}>X</ResultDetailIcon>
                      )}
                      <ResultDetailContent>
                        {item.success ? (
                          <>
                            <ResultDetailContentTitle numberOfLines={1}>
                              {item.contentTitle || item.videoTitle}
                            </ResultDetailContentTitle>
                            <ResultDetailVideoTitle numberOfLines={1}>
                              {item.videoTitle}
                            </ResultDetailVideoTitle>
                          </>
                        ) : (
                          <>
                            <ResultDetailVideoId numberOfLines={1}>
                              {item.videoId}
                            </ResultDetailVideoId>
                            <ResultDetailError numberOfLines={1}>
                              {item.error || '알 수 없는 오류'}
                            </ResultDetailError>
                          </>
                        )}
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
              </ResultDetails>
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

const Description = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginBottom: 12,
});

const UrlInput = styled.TextInput({
  backgroundColor: colors.gray06,
  borderRadius: 12,
  padding: 16,
  minHeight: 140,
  ...textStyles.body3,
  color: colors.white,
  borderWidth: 1,
  borderColor: colors.gray05,
});

const ProgressContainer = styled.View({
  marginTop: 16,
});

const ProgressText = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginBottom: 8,
});

const ProgressBar = styled.View({
  height: 4,
  backgroundColor: colors.gray05,
  borderRadius: 2,
  overflow: 'hidden',
});

const ProgressFill = styled.View<{ width: number }>(({ width }) => ({
  height: '100%',
  width: `${width}%`,
  backgroundColor: colors.green,
}));

const ButtonContainer = styled.View({
  marginTop: 20,
});

const ResultContainer = styled.View({
  marginTop: 24,
  padding: 16,
  backgroundColor: colors.gray06,
  borderRadius: 12,
});

const ResultTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 12,
});

const ResultSummary = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
});

const ResultItem = styled.View({
  alignItems: 'center',
});

const ResultLabel = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  marginBottom: 4,
});

const ResultValue = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const ResultDetails = styled.View({
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
  paddingTop: 12,
});

const ResultDetailItem = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
});

const PosterContainer = styled.View({
  marginRight: 12,
});

const ResultDetailIcon = styled.Text<{ success: boolean }>(({ success }) => ({
  ...textStyles.body1,
  color: success ? colors.green : colors.red,
  width: 24,
}));

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

const ResultDetailVideoId = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
});

const ResultDetailError = styled.Text({
  ...textStyles.body3,
  color: colors.red,
  marginTop: 2,
});

const ChevronText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
  marginLeft: 8,
});

export const VideoRegistrationTab = memo(VideoRegistrationTabComponent);
