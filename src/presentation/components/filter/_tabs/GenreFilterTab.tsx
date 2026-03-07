/**
 * GenreFilterTab - 장르 필터 탭 콘텐츠
 *
 * 콘텐츠 타입(전체/영화/시리즈) 선택과 장르 칩 다중선택 UI를 제공합니다.
 * 콘텐츠 타입에 따라 표시되는 장르 목록이 자동으로 변경됩니다.
 */

import React, { useCallback } from 'react';
import styled from '@emotion/native';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import { ContentType } from '@/core/types/content/contentType.enum';
import { getGenresByContentType } from '@/features/content/constants/genreConstants';
import { toggleArrayItem } from '@/core/utils';
import { FilterChip } from '../FilterChip';
import { FilterChipGrid } from '../FilterChipGrid';
import { FilterSectionHeader } from '../FilterSectionHeader';

interface GenreFilterTabProps {
  /** 현재 선택된 콘텐츠 타입 */
  readonly contentType: ContentType | null;
  /** 현재 선택된 장르 ID 목록 */
  readonly selectedGenreIds: number[];
  /** 콘텐츠 타입 변경 콜백 */
  readonly onContentTypeChange: (type: ContentType | null) => void;
  /** 장르 ID 목록 변경 콜백 */
  readonly onGenreIdsChange: (ids: number[]) => void;
}

interface ContentTypeOption {
  readonly label: string;
  readonly value: ContentType | null;
}

const CONTENT_TYPE_OPTIONS: readonly ContentTypeOption[] = [
  { label: '전체', value: null },
  { label: '영화', value: 'movie' },
  { label: '시리즈', value: 'tv' },
] as const;

function GenreFilterTab({
  contentType,
  selectedGenreIds,
  onContentTypeChange,
  onGenreIdsChange,
}: GenreFilterTabProps): React.ReactElement {
  const genres = getGenresByContentType(contentType);

  // 장르 토글
  const handleGenreToggle = useCallback(
    (genreId: number) => {
      onGenreIdsChange(toggleArrayItem(selectedGenreIds, genreId));
    },
    [selectedGenreIds, onGenreIdsChange],
  );

  return (
    <>
      {/* 콘텐츠 타입 선택 */}
      <SectionContainer>
        <SectionLabel>콘텐츠 타입</SectionLabel>
        <ContentTypeRow>
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.label}
              label={option.label}
              selected={contentType === option.value}
              onPress={() => onContentTypeChange(option.value)}
            />
          ))}
        </ContentTypeRow>
      </SectionContainer>

      {/* 장르 선택 */}
      <FilterSectionHeader title="장르" />
      <FilterChipGrid>
        {genres.map((genre) => (
          <FilterChip
            key={genre.id}
            label={genre.name}
            selected={selectedGenreIds.includes(genre.id)}
            onPress={() => handleGenreToggle(genre.id)}
          />
        ))}
      </FilterChipGrid>
    </>
  );
}

/* Styled Components */

const SectionContainer = styled.View({
  paddingHorizontal: 20,
  paddingTop: 20,
  gap: 12,
});

const SectionLabel = styled.Text({
  ...textStyles.title1,
  color: colors.gray02,
});

const ContentTypeRow = styled.View({
  flexDirection: 'row',
  gap: 8,
});

export { GenreFilterTab };
export type { GenreFilterTabProps };
