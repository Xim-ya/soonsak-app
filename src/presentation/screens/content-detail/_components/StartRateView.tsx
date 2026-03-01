import React from 'react';
import styled from '@emotion/native';
import StarBlankSvg from '@assets/icons/star_blank.svg';
import StarFilledSvg from '@assets/icons/star_filled.svg';
import StarHalfSvg from '@assets/icons/star_half.svg';

interface StarRateProps {
  rating?: number;
}

type StarType = 'filled' | 'half' | 'blank';

const TOTAL_STARS = 5;
const HALF_STAR_THRESHOLD = 0.5;
const STAR_SIZE = 22;

/**
 * 별점을 표시하는 컴포넌트
 * rating이 null인 경우 스켈레톤 상태로 빈 별들을 표시합니다.
 */
export const StartRateView = React.memo<StarRateProps>(({ rating }) => {
  const renderSkeletonStars = () => (
    <Container>
      {Array.from({ length: TOTAL_STARS }, (_, index) => (
        <StarBlankSvg key={index} width={STAR_SIZE} height={STAR_SIZE} />
      ))}
    </Container>
  );

  const getStarType = (index: number, fullStars: number, decimalPart: number): StarType => {
    if (index < fullStars) {
      return 'filled';
    }

    if (index === fullStars && decimalPart >= HALF_STAR_THRESHOLD) {
      return 'half';
    }

    return 'blank';
  };

  const renderStar = (type: StarType, index: number) => {
    switch (type) {
      case 'filled':
        return <StarFilledSvg key={index} width={STAR_SIZE} height={STAR_SIZE} />;
      case 'half':
        return <StarHalfSvg key={index} width={STAR_SIZE} height={STAR_SIZE} />;
      case 'blank':
      default:
        return <StarBlankSvg key={index} width={STAR_SIZE} height={STAR_SIZE} />;
    }
  };

  if (rating == null) {
    return renderSkeletonStars();
  }

  const fullStars = Math.floor(rating);
  const decimalPart = rating - fullStars;

  return (
    <Container>
      {Array.from({ length: TOTAL_STARS }, (_, index) => {
        const starType = getStarType(index, fullStars, decimalPart);
        return renderStar(starType, index);
      })}
    </Container>
  );
});

/* Styled Components */
const Container = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

StartRateView.displayName = 'StarRatingView';
