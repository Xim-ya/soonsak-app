import type { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * 탭 이름 상수
 */
export const USER_CONTENT_TAB_NAMES = ['찜했어요', '평가했어요', '봤어요'] as const;
export type UserContentTabName = (typeof USER_CONTENT_TAB_NAMES)[number];

/**
 * 사용자 콘텐츠 아이템 - 통합 UI 모델
 * favorites, ratings, watched 목록에서 공통으로 사용
 */
export interface UserContentItem {
  readonly id: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly contentTitle: string;
  readonly contentPosterPath: string;
  readonly rating?: number; // ratings 탭에서만 사용
}
