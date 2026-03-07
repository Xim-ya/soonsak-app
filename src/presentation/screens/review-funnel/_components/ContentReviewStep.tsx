import { useState, useCallback } from 'react';
import { TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import type { EdgeInsets } from 'react-native-safe-area-context';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { RecommendedContent } from '@/features/review-funnel/types';
import {
  FUNNEL_BACKGROUND_COLORS,
  HIT_SLOP,
  TMDB_IMAGE_BASE,
  POSTER_SIZE,
} from '@/features/review-funnel/constants';
import CloseIcon from '@assets/icons/close.svg';

interface ContentReviewStepProps {
  watchedContents: RecommendedContent[];
  onRatingOnlyClick: () => void;
  onWriteReviewClick: () => void;
  onClose: () => void;
  insets: EdgeInsets;
}

/**
 * ContentReviewStep - 리뷰 유도 화면
 *
 * 감사 메시지와 함께 리뷰 작성을 유도합니다.
 * iOS에서는 버튼 클릭 시 "평점만 남길게요" / "리뷰 내용도 적을게요" 두 개로 분리됩니다.
 */
export function ContentReviewStep({
  watchedContents,
  onRatingOnlyClick,
  onWriteReviewClick,
  onClose,
  insets,
}: ContentReviewStepProps) {
  const isIOS = Platform.OS === 'ios';
  const hasContents = watchedContents.length > 0;

  // iOS: 버튼 확장 상태 (두 개로 분리)
  const [isExpanded, setIsExpanded] = useState(false);
  // Android: 스킵 버튼 숨김 상태
  const [hideSkipButton, setHideSkipButton] = useState(false);

  // 버튼 클릭 핸들러
  const handleReviewButtonClick = useCallback(() => {
    if (isIOS) {
      // iOS: 버튼 두 개로 분리
      setIsExpanded(true);
    } else {
      // Android: 스킵 버튼만 숨기고 바로 인앱 리뷰
      setHideSkipButton(true);
      onRatingOnlyClick();
    }
  }, [isIOS, onRatingOnlyClick]);

  return (
    <Container>
      {/* 배경 그래디언트 */}
      <BackgroundGradient
        colors={FUNNEL_BACKGROUND_COLORS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* 닫기 버튼 */}
      <CloseButtonContainer style={{ top: insets.top + 16 }}>
        <TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP}>
          <CloseIcon width={24} height={24} color={colors.white} />
        </TouchableOpacity>
      </CloseButtonContainer>

      {/* 콘텐츠 영역 */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 시청한 콘텐츠 포스터 */}
        {hasContents && (
          <>
            <HeaderText>지금까지 순삭에서{'\n'}이런 콘텐츠를 즐겼어요</HeaderText>
            <PosterGrid>
              {watchedContents.map((content) => (
                <PosterCard key={`${content.contentId}-${content.contentType}`}>
                  {content.posterPath ? (
                    <PosterImage
                      source={{ uri: `${TMDB_IMAGE_BASE}${content.posterPath}` }}
                      resizeMode="cover"
                    />
                  ) : (
                    <PosterPlaceholder>
                      <PlaceholderText>{content.title.slice(0, 2)}</PlaceholderText>
                    </PosterPlaceholder>
                  )}
                  <PosterTitle numberOfLines={2}>{content.title}</PosterTitle>
                </PosterCard>
              ))}
            </PosterGrid>
          </>
        )}

        {/* 감사 메시지 */}
        <MessageContainer>
          <MessageText>
            그동안 순삭을 이용해 주셔서{'\n'}
            정말 감사해요
          </MessageText>
          <SubMessageText>
            여러분의 소중한 리뷰 한 줄이{'\n'}
            더 나은 순삭을 만드는 데 큰 힘이 돼요
          </SubMessageText>
        </MessageContainer>

        {/* 리뷰 버튼 */}
        <ButtonContainer>
          {!isExpanded ? (
            // 기본 버튼 상태
            <Animated.View
              layout={Layout.springify()}
              exiting={FadeOut.duration(150)}
            >
              <ReviewButton onPress={handleReviewButtonClick} activeOpacity={0.8}>
                <ReviewButtonText>소중한 리뷰 남겨주시겠어요?</ReviewButtonText>
              </ReviewButton>
            </Animated.View>
          ) : isIOS ? (
            // iOS: 확장된 버튼 상태 (두 개로 분리)
            <Animated.View
              entering={FadeIn.duration(200).delay(100)}
              layout={Layout.springify()}
            >
              <DividedButtonContainer>
                <DividedButton
                  onPress={onRatingOnlyClick}
                  activeOpacity={0.8}
                  style={{ backgroundColor: colors.gray05, borderWidth: 1, borderColor: colors.gray04 }}
                >
                  <DividedButtonText style={{ color: colors.white }}>
                    평점만 남길게요
                  </DividedButtonText>
                </DividedButton>
                <DividedButton
                  onPress={onWriteReviewClick}
                  activeOpacity={0.8}
                  style={{ backgroundColor: colors.main }}
                >
                  <DividedButtonText style={{ color: colors.black }}>
                    리뷰 내용도 적을게요
                  </DividedButtonText>
                </DividedButton>
              </DividedButtonContainer>
            </Animated.View>
          ) : null}
          <SkipButton
            onPress={onClose}
            activeOpacity={0.7}
            style={isExpanded || hideSkipButton ? { opacity: 0 } : undefined}
            disabled={isExpanded || hideSkipButton}
          >
            <SkipButtonText>다음에 할게요</SkipButtonText>
          </SkipButton>
        </ButtonContainer>
      </ScrollView>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
});

const BackgroundGradient = styled(LinearGradient)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

const CloseButtonContainer = styled.View({
  position: 'absolute',
  right: 16,
  zIndex: 10,
});

const HeaderText = styled.Text({
  ...textStyles.headline2,
  color: colors.white,
  textAlign: 'center',
  marginBottom: 24,
  lineHeight: 30,
});

const PosterGrid = styled.View({
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 12,
  marginBottom: 32,
});

const PosterCard = styled.View({
  width: POSTER_SIZE.width,
  alignItems: 'center',
});

const PosterImage = styled(Image)({
  width: POSTER_SIZE.width,
  height: POSTER_SIZE.height,
  borderRadius: 8,
  backgroundColor: colors.gray05,
});

const PosterPlaceholder = styled.View({
  width: POSTER_SIZE.width,
  height: POSTER_SIZE.height,
  borderRadius: 8,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
});

const PlaceholderText = styled.Text({
  ...textStyles.headline2,
  color: colors.gray03,
});

const PosterTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  marginTop: 8,
  textAlign: 'center',
});

const MessageContainer = styled.View({
  alignItems: 'center',
  marginBottom: 40,
});

const MessageText = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
  textAlign: 'center',
  marginBottom: 16,
  lineHeight: 36,
});

const SubMessageText = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
  textAlign: 'center',
  lineHeight: 24,
});

const ButtonContainer = styled.View({
  marginTop: 'auto',
});

const ReviewButton = styled.TouchableOpacity({
  backgroundColor: colors.main,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  marginBottom: 12,
});

const ReviewButtonText = styled.Text({
  ...textStyles.title1,
  color: colors.black,
  fontWeight: '700',
});

const DividedButtonContainer = styled.View({
  flexDirection: 'row',
  gap: 10,
  marginBottom: 12,
});

const DividedButton = styled.TouchableOpacity({
  flex: 1,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
});

const DividedButtonText = styled.Text({
  ...textStyles.title1,
  fontWeight: '700',
});

const SkipButton = styled.TouchableOpacity({
  paddingVertical: 12,
  alignItems: 'center',
});

const SkipButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  textDecorationLine: 'underline',
});
