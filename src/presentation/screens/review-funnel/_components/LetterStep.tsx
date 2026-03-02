import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EdgeInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { FUNNEL_BACKGROUND_COLORS, HIT_SLOP } from '@/features/review-funnel/constants';
import CloseIcon from '@assets/icons/close.svg';

interface LetterStepProps {
  userName: string;
  onOpen: () => void;
  onClose: () => void;
  insets: EdgeInsets;
}

/**
 * LetterStep - 편지 도착 화면
 *
 * 로티 애니메이션과 함께 "순삭 개발자가 편지를 보냈어요" 메시지를 표시합니다.
 */
export function LetterStep({ userName, onOpen, onClose, insets }: LetterStepProps) {
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
      <ContentContainer style={{ paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }}>
        {/* 편지 애니메이션 */}
        <AnimationContainer>
          <LottieView
            source={require('@assets/lottie/letter.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
        </AnimationContainer>

        {/* 텍스트 영역 */}
        <TextContainer>
          <TitleText>개발자가</TitleText>
          <HighlightRow>
            <HighlightText>{userName}</HighlightText>
            <TitleText> 유저님께</TitleText>
          </HighlightRow>
          <TitleText>감사의 편지를 보냈어요</TitleText>
        </TextContainer>

        {/* 버튼 영역 */}
        <ButtonContainer>
          <OpenButton onPress={onOpen} activeOpacity={0.8}>
            <OpenButtonText>확인해보시겠어요?</OpenButtonText>
          </OpenButton>
        </ButtonContainer>
      </ContentContainer>
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

const ContentContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 24,
});

const AnimationContainer = styled.View({
  marginBottom: 40,
});

const TextContainer = styled.View({
  alignItems: 'center',
  marginBottom: 60,
});

const TitleText = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
  textAlign: 'center',
});

const HighlightRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const HighlightText = styled.Text({
  ...textStyles.headline1,
  color: colors.main,
});

const ButtonContainer = styled.View({
  width: '100%',
  paddingHorizontal: 20,
});

const OpenButton = styled.TouchableOpacity({
  backgroundColor: colors.main,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
});

const OpenButtonText = styled.Text({
  ...textStyles.title1,
  color: colors.black,
  fontWeight: '700',
});
