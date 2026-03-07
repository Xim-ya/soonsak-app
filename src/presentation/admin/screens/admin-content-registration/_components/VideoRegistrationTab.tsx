/**
 * VideoRegistrationTab - 영상 등록 탭
 *
 * YouTube 영상 URL을 입력받아 등록합니다.
 * 여러 URL을 줄바꿈 또는 쉼표로 구분하여 일괄 입력할 수 있습니다.
 */

import { memo } from 'react';
import { ScrollView } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { PrimaryButton } from '@/presentation/components/button/PrimaryButton';
import type { BatchRegistrationResult } from '@/features/admin';
import { RegistrationResultItem } from './RegistrationResultItem';

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
  const buttonState = isRegistering ? 'loading' : urlInput.trim() ? 'enabled' : 'disabled';

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionTitle>YouTube 영상 URL</SectionTitle>
        <Description>
          YouTube 영상 URL을 입력하세요.{'\n'}
          여러 URL은 줄바꿈 또는 쉼표로 구분합니다.
        </Description>

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

        <ButtonContainer>
          <PrimaryButton title="영상 등록" onPress={onRegister} state={buttonState} />
        </ButtonContainer>

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
                <SuccessResultValue>{result.success}개</SuccessResultValue>
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

            {result.results.length > 0 && (
              <ResultDetails>
                {result.results.map((item, index) => (
                  <RegistrationResultItem
                    key={`${item.videoId}-${index}`}
                    item={item}
                    index={index}
                    showErrorState
                  />
                ))}
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

const SuccessResultValue = styled.Text({
  ...textStyles.title1,
  color: colors.green,
});

const SkippedResultValue = styled.Text({
  ...textStyles.title1,
  color: colors.gray02,
});

const FailedResultValue = styled.Text({
  ...textStyles.title1,
  color: colors.red,
});

const ResultDetails = styled.View({
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
  paddingTop: 12,
});

export const VideoRegistrationTab = memo(VideoRegistrationTabComponent);
