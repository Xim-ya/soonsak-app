import { memo } from 'react';
import styled from '@emotion/native';
import Svg, { Path } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

interface RatingOverlayProps {
  rating: number;
}

/**
 * 별점 오버레이 컴포넌트 (읽기 전용)
 * 카드 하단에 별 아이콘 + 점수 표시
 */
function RatingOverlayComponent({ rating }: RatingOverlayProps) {
  return (
    <Container>
      <StarIcon />
      <RatingText>{rating.toFixed(1)}</RatingText>
    </Container>
  );
}

function StarIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={colors.primary}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

const Container = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  paddingVertical: 4,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  borderBottomLeftRadius: 4,
  borderBottomRightRadius: 4,
});

const RatingText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontSize: 11,
});

export const RatingOverlay = memo(RatingOverlayComponent);
