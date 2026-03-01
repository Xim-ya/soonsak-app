import type { ContentType } from './contentType.enum';

/**
 * BaseContentRefModel - 콘텐츠 참조 기본 모델
 *
 * 콘텐츠를 참조하는 모델들의 공통 필드를 정의합니다.
 * FavoriteModel, RatingModel, WatchHistoryModel, ChannelVideoModel 등에서 확장하여 사용합니다.
 *
 * @example
 * interface FavoriteModel extends BaseContentRefModel {
 *   readonly id: string;
 *   readonly contentBackdropPath: string;
 * }
 */
export interface BaseContentRefModel {
  /** 참조하는 콘텐츠 ID */
  readonly contentId: number;
  /** 콘텐츠 타입 (movie/tv) */
  readonly contentType: ContentType;
  /** 콘텐츠 제목 */
  readonly contentTitle: string;
  /** 콘텐츠 포스터 이미지 경로 */
  readonly contentPosterPath: string;
}
