import type { ContentType } from '@/shared/types/content/contentType.enum';

/** 평점 DTO (DB 스키마) */
export interface RatingDto {
  id: string;
  userId: string;
  contentId: number;
  contentType: ContentType;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

/** 평점 등록/수정 파라미터 */
export interface SetRatingParams {
  contentId: number;
  contentType: ContentType;
  rating: number; // 0.0 ~ 5.0 (0.5 단위, 0.0은 취소)
}

/** 평점 상태 응답 */
export interface RatingStatusResponse {
  hasRating: boolean;
  rating: number | null;
  ratingId: string | null;
}

/** 평점 + 콘텐츠 정보 조인 DTO */
export interface RatingWithContentDto extends RatingDto {
  contentTitle: string;
  contentPosterPath: string;
  contentBackdropPath: string;
}
