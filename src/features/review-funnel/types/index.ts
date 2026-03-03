import type { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * 리뷰 타입
 * - in_app_review: Android 인앱 리뷰 (평점+리뷰 통합)
 * - rating_only: iOS 평점만 남기기 (인앱 리뷰)
 * - write_review: iOS 리뷰 내용도 작성 (스토어 이동)
 */
export type ReviewType = 'in_app_review' | 'rating_only' | 'write_review';

/**
 * 퍼널에서 보여줄 추천 콘텐츠 정보
 */
export interface RecommendedContent {
  contentId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
}

/**
 * 리뷰 퍼널 세션 DTO
 *
 * has_reviewed 상태:
 * - null: 푸시만 받음 (아직 안 열음)
 * - false: 퍼널 진입했지만 이탈
 * - true: 리뷰 버튼 클릭 완료
 */
export interface ReviewFunnelSessionDto {
  id: string;
  userId: string;
  notificationId: string | null;
  platform: 'ios' | 'android' | null;
  appVersion: string | null;
  hasReviewed: boolean | null;
  reviewType: ReviewType | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 퍼널 세션 생성 파라미터
 */
export interface CreateFunnelSessionParams {
  notificationId?: string | undefined;
  platform?: 'ios' | 'android' | undefined;
  appVersion?: string | undefined;
}
