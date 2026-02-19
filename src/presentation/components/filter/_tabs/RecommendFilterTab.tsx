/**
 * RecommendFilterTab - 추천 필터 탭 콘텐츠
 *
 * 결말 포함 여부 등 추천 관련 필터 옵션을 제공합니다.
 */

import React, { useCallback } from 'react';
import { FilterChip } from '../FilterChip';
import { FilterChipGrid } from '../FilterChipGrid';
import { FilterSectionHeader } from '../FilterSectionHeader';

interface RecommendFilterTabProps {
  /** 결말 포함 여부 */
  readonly includeEnding: boolean;
  /** 결말 포함 여부 변경 콜백 */
  readonly onIncludeEndingChange: (value: boolean) => void;
  /** 본 작품 제외 여부 */
  readonly excludeWatched?: boolean;
  /** 본 작품 제외 여부 변경 콜백 */
  readonly onExcludeWatchedChange?: (value: boolean) => void;
}

function RecommendFilterTab({
  includeEnding,
  onIncludeEndingChange,
  excludeWatched = false,
  onExcludeWatchedChange,
}: RecommendFilterTabProps): React.ReactElement {
  const handleEndingToggle = useCallback(() => {
    onIncludeEndingChange(!includeEnding);
  }, [includeEnding, onIncludeEndingChange]);

  const handleWatchedToggle = useCallback(() => {
    onExcludeWatchedChange?.(!excludeWatched);
  }, [excludeWatched, onExcludeWatchedChange]);

  return (
    <>
      <FilterSectionHeader title="추천" />
      <FilterChipGrid>
        <FilterChip label="결말포함" selected={includeEnding} onPress={handleEndingToggle} />
        <FilterChip label="본 작품 제외" selected={excludeWatched} onPress={handleWatchedToggle} />
      </FilterChipGrid>
    </>
  );
}

export { RecommendFilterTab };
export type { RecommendFilterTabProps };
