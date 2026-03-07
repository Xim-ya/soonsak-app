/**
 * 정렬 타입 공통 정의
 *
 * 채널, 콘텐츠 등 여러 도메인에서 공통으로 사용하는 정렬 타입입니다.
 * - all: 전체 (랜덤 정렬)
 * - latest: 최신순
 * - popular: 인기순
 */
type SortType = 'all' | 'latest' | 'popular';

/** 정렬 옵션 아이템 */
interface SortOption<T extends string = SortType> {
  readonly value: T;
  readonly label: string;
}

/** 기본 정렬 옵션 목록 */
const DEFAULT_SORT_OPTIONS: SortOption<SortType>[] = [
  { value: 'all', label: '전체' },
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

export type { SortType, SortOption };
export { DEFAULT_SORT_OPTIONS };
