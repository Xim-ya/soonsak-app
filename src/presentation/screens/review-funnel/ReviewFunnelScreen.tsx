import { StatusBar, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import { useReviewFunnel } from '@/features/review-funnel/hooks/useReviewFunnel';
import { FUNNEL_BACKGROUND_COLORS } from '@/features/review-funnel/constants';
import { LetterStep } from './_components/LetterStep';
import { ContentReviewStep } from './_components/ContentReviewStep';

/**
 * ReviewFunnelScreen - 리뷰 유도 퍼널 화면
 *
 * 푸시 알림 딥링크를 통해 진입하며, 감성적인 편지 컨셉으로
 * 유저에게 리뷰 작성을 유도합니다.
 *
 * 퍼널 단계:
 * 1. 편지 화면 (Letter) - 로티 애니메이션 + "편지를 보냈어요"
 * 2. 리뷰 유도 화면 (Content) - 감사 메시지 + 리뷰 유도
 */
export default function ReviewFunnelScreen() {
  const insets = useSafeAreaInsets();

  const {
    viewStep,
    isLoading,
    error,
    userName,
    watchedContents,
    handleLetterOpen,
    handleRatingOnlyClick,
    handleWriteReviewClick,
    handleClose,
  } = useReviewFunnel();

  if (isLoading) {
    return (
      <Container>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <BackgroundGradient
          colors={FUNNEL_BACKGROUND_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.main} />
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <BackgroundGradient
          colors={FUNNEL_BACKGROUND_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <ErrorContainer style={{ paddingTop: insets.top }}>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={handleClose}>
            <RetryButtonText>닫기</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {viewStep === 'letter' ? (
        <LetterStep
          userName={userName}
          onOpen={handleLetterOpen}
          onClose={handleClose}
          insets={insets}
        />
      ) : (
        <ContentReviewStep
          watchedContents={watchedContents}
          onRatingOnlyClick={handleRatingOnlyClick}
          onWriteReviewClick={handleWriteReviewClick}
          onClose={handleClose}
          insets={insets}
        />
      )}
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const BackgroundGradient = styled(LinearGradient)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const ErrorContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 24,
});

const ErrorText = styled.Text({
  fontSize: 16,
  color: colors.gray02,
  textAlign: 'center',
  marginBottom: 24,
});

const RetryButton = styled.TouchableOpacity({
  paddingHorizontal: 24,
  paddingVertical: 12,
  backgroundColor: colors.gray05,
  borderRadius: 8,
});

const RetryButtonText = styled.Text({
  fontSize: 15,
  color: colors.white,
  fontWeight: '600',
});
