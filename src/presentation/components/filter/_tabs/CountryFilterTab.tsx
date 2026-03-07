/**
 * CountryFilterTab - 국가 필터 탭 콘텐츠
 *
 * 제작 국가를 칩 형태로 다중선택할 수 있습니다.
 * DB에 실제 콘텐츠가 존재하는 국가만 표시합니다.
 */

import React, { useCallback } from 'react';
import { COUNTRY_OPTIONS } from '@/core/constants/countryConstants';
import { toggleArrayItem } from '@/core/utils';
import { FilterChip } from '../FilterChip';
import { FilterChipGrid } from '../FilterChipGrid';
import { FilterSectionHeader } from '../FilterSectionHeader';

interface CountryFilterTabProps {
  /** 현재 선택된 국가 코드 목록 */
  readonly selectedCountryCodes: string[];
  /** 국가 코드 목록 변경 콜백 */
  readonly onCountryCodesChange: (codes: string[]) => void;
}

function CountryFilterTab({
  selectedCountryCodes,
  onCountryCodesChange,
}: CountryFilterTabProps): React.ReactElement {
  // 국가 토글
  const handleCountryToggle = useCallback(
    (code: string) => {
      onCountryCodesChange(toggleArrayItem(selectedCountryCodes, code));
    },
    [selectedCountryCodes, onCountryCodesChange],
  );

  return (
    <>
      <FilterSectionHeader title="국가" />
      <FilterChipGrid>
        {COUNTRY_OPTIONS.map((country) => (
          <FilterChip
            key={country.code}
            label={country.name}
            selected={selectedCountryCodes.includes(country.code)}
            onPress={() => handleCountryToggle(country.code)}
          />
        ))}
      </FilterChipGrid>
    </>
  );
}

export { CountryFilterTab };
export type { CountryFilterTabProps };
