/**
 * ReleaseYearFilterTab - 공개연도 필터 탭 콘텐츠
 *
 * 연도 범위를 프리셋 칩으로 빠르게 선택할 수 있습니다.
 */

import React from 'react';
import styled from '@emotion/native';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import { YearQuickSelect } from '../YearQuickSelect';
import type { YearRange } from '@/core/types/filter/contentFilter';

interface ReleaseYearFilterTabProps {
  /** 현재 선택된 연도 범위 */
  readonly selectedRange: YearRange | null;
  /** 연도 범위 변경 콜백 */
  readonly onRangeChange: (range: YearRange | null) => void;
}

function ReleaseYearFilterTab({
  selectedRange,
  onRangeChange,
}: ReleaseYearFilterTabProps): React.ReactElement {
  return (
    <Container>
      <SectionLabel>공개연도</SectionLabel>
      <YearQuickSelect selectedRange={selectedRange} onSelect={onRangeChange} />
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  paddingTop: 24,
  gap: 12,
});

const SectionLabel = styled.Text({
  ...textStyles.title1,
  color: colors.gray02,
  paddingHorizontal: 20,
});

export { ReleaseYearFilterTab };
export type { ReleaseYearFilterTabProps };
