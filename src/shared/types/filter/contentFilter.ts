/**
 * ContentFilter - 콘텐츠 필터 상태 모델
 *
 * 바텀시트에서 설정한 필터 조건을 표현하는 타입입니다.
 * 빠른탐색 페이지, 검색 페이지 등 다양한 화면에서 재사용됩니다.
 */

import { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * 콘텐츠 필터 상태
 */
interface ContentFilter {
  /** 콘텐츠 타입 (null = 전체) */
  readonly contentType: ContentType | null;
  /** 선택된 장르 ID 목록 (빈 배열 = 전체) */
  readonly genreIds: number[];
  /** 선택된 국가 코드 목록 (빈 배열 = 전체) */
  readonly countryCodes: string[];
  /** 공개연도 범위 (null = 제한 없음) */
  readonly releaseYearRange: YearRange | null;
  /** TMDB 평점 최소 별점 (null = 제한 없음, 1~5 스케일) */
  readonly minStarRating: number | null;
  /** 결말 포함 여부 */
  readonly includeEnding: boolean;
  /** 선택된 채널 ID 목록 (빈 배열 = 전체) */
  readonly channelIds: string[];
  /** 본 작품 제외 여부 (추후 활성화 예정) */
  readonly excludeWatched: boolean;
}

interface YearRange {
  readonly min: number;
  readonly max: number;
}

/** 필터 탭 키 */
type FilterTabKey = 'recommend' | 'genre' | 'country' | 'releaseYear' | 'rating' | 'channel';

/** 필터 탭 설정 */
interface FilterTabConfig {
  readonly key: FilterTabKey;
  readonly label: string;
}

/** 전체 필터 탭 목록 */
const FILTER_TABS: readonly FilterTabConfig[] = [
  { key: 'recommend', label: '추천' },
  { key: 'genre', label: '장르' },
  { key: 'country', label: '국가' },
  { key: 'releaseYear', label: '공개연도' },
  { key: 'rating', label: '평점' },
  { key: 'channel', label: '채널' },
] as const;

/** 필터 초기 상태 (필터 없음) */
const DEFAULT_CONTENT_FILTER: ContentFilter = {
  contentType: null,
  genreIds: [],
  countryCodes: [],
  releaseYearRange: null,
  minStarRating: null,
  includeEnding: false,
  channelIds: [],
  excludeWatched: false,
};

/** 필터가 적용되었는지 확인 */
function isFilterActive(filter: ContentFilter): boolean {
  return (
    filter.contentType !== null ||
    filter.genreIds.length > 0 ||
    filter.countryCodes.length > 0 ||
    filter.releaseYearRange !== null ||
    filter.minStarRating !== null ||
    filter.includeEnding ||
    filter.channelIds.length > 0 ||
    filter.excludeWatched
  );
}

/** 적용된 필터 수 계산 */
function getActiveFilterCount(filter: ContentFilter): number {
  let count = 0;
  if (filter.contentType !== null) count++;
  if (filter.genreIds.length > 0) count++;
  if (filter.countryCodes.length > 0) count++;
  if (filter.releaseYearRange !== null) count++;
  if (filter.minStarRating !== null) count++;
  if (filter.includeEnding) count++;
  if (filter.channelIds.length > 0) count++;
  if (filter.excludeWatched) count++;
  return count;
}

export type { ContentFilter, YearRange, FilterTabKey, FilterTabConfig };

export { FILTER_TABS, DEFAULT_CONTENT_FILTER, isFilterActive, getActiveFilterCount };
