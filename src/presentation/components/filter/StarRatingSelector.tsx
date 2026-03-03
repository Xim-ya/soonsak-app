/**
 * StarRatingSelector - 별점 선택 필터 컴포넌트
 *
 * 별 아이콘을 드래그하여 최소 평점을 선택합니다.
 * 0.5 단위로 세밀하게 선택 가능합니다.
 * 선택한 별 이하는 filled, 이상은 blank로 표시됩니다.
 * TMDB 10점 만점을 5점 스케일로 변환하여 사용합니다.
 *
 * @example
 * <StarRatingSelector
 *   selectedRating={3.5}
 *   onSelect={(rating) => updateFilter({ minStarRating: rating })}
 * />
 */

import React from 'react';
import styled from '@emotion/native';
import { InteractiveStarRating } from '@/presentation/components/rating';

const STAR_SIZE = 32;
const STAR_GAP = 8;

interface StarRatingSelectorProps {
  /** 현재 선택된 최소 별점 (1~5, null = 미선택) */
  readonly selectedRating: number | null;
  /** 별점 선택 콜백 */
  readonly onSelect: (rating: number | null) => void;
}

function StarRatingSelector({
  selectedRating,
  onSelect,
}: StarRatingSelectorProps): React.ReactElement {
  return (
    <Container>
      <InteractiveStarRating
        value={selectedRating}
        onChange={onSelect}
        mode="drag"
        step={0.5}
        size={STAR_SIZE}
        gap={STAR_GAP}
      />
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  paddingHorizontal: 20,
});

export { StarRatingSelector };
export type { StarRatingSelectorProps };
