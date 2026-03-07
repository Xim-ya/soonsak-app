/**
 * Explore 화면 전용 타입 정의
 */

import { ContentType } from '@/core/types/content/contentType.enum';
import type { LogoLanguage, CurationVideoModel } from '@/features/content/types';

/** 정렬 타입 */
type ExploreSortType = 'all' | 'latest' | 'popular';

/** 정렬 탭 설정 */
interface ExploreSortTabConfig {
  readonly key: ExploreSortType;
  readonly label: string;
  readonly isDisabled?: boolean;
}

/** 정렬 탭 목록 */
const EXPLORE_SORT_TABS: readonly ExploreSortTabConfig[] = [
  { key: 'all', label: '전체' },
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

/** Explore 콘텐츠 모델 */
interface ExploreContentModel {
  readonly id: number;
  readonly title: string;
  readonly type: ContentType;
  readonly posterPath: string | undefined;
  readonly backdropPath?: string | undefined;
  readonly titleLogo?: string | undefined;
  readonly titleLogoLang?: LogoLanguage | undefined;
}

/** 페이지네이션 응답 */
interface ExploreContentsResponse {
  readonly contents: ExploreContentModel[];
  readonly hasMore: boolean;
  readonly totalCount: number;
}

export type {
  ExploreSortType,
  ExploreSortTabConfig,
  ExploreContentModel,
  ExploreContentsResponse,
  CurationVideoModel,
};
export { EXPLORE_SORT_TABS };
