/**
 * yearConstants - 공개연도 프리셋 상수 정의
 *
 * 콘텐츠 필터에서 공개연도 범위를 빠르게 선택할 수 있는 프리셋 목록입니다.
 */

import type { YearRange } from '@/core/types/filter/contentFilter';

interface YearPreset {
  readonly label: string;
  readonly range: YearRange;
}

const CURRENT_YEAR = new Date().getFullYear();

/** 연도 범위 퀵 선택 프리셋 */
const YEAR_PRESETS: readonly YearPreset[] = [
  { label: '올해', range: { min: CURRENT_YEAR, max: CURRENT_YEAR } },
  { label: '2020년대', range: { min: 2020, max: 2029 } },
  { label: '2010년대', range: { min: 2010, max: 2019 } },
  { label: '2000년대', range: { min: 2000, max: 2009 } },
  { label: '1990년대', range: { min: 1990, max: 1999 } },
  { label: '그 이전', range: { min: 1900, max: 1989 } },
] as const;

export { YEAR_PRESETS };
export type { YearPreset };
