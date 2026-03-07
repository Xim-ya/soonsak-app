import type { ContentType } from '@/core/types/content/contentType.enum';

/**
 * ISO 8601 형식의 타임스탬프 문자열 타입
 */
type ISOTimestamp = string;

/**
 * 찜 DTO
 * favorites 테이블과 1대1 대응
 * user_id + content_id + content_type로 유니크
 */
interface FavoriteDto {
  readonly id: string;
  readonly userId: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly createdAt: ISOTimestamp;
}

/**
 * 찜 + 콘텐츠 정보 조인 DTO
 * 찜 목록에서 포스터 이미지를 표시할 때 사용
 */
interface FavoriteWithContentDto extends FavoriteDto {
  readonly contentTitle: string;
  readonly contentPosterPath: string;
  readonly contentBackdropPath: string;
}

/**
 * 찜 토글 파라미터
 */
interface ToggleFavoriteParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  /** 화면 이름 (GA 로깅용, 기본값: 'content_detail') */
  readonly screenName?: string;
  /** 유저 ID (웹훅 알림용) */
  readonly userId?: string;
  /** 유저 닉네임 (웹훅 알림용) */
  readonly nickname?: string;
  /** 영상 제목 (웹훅 알림용) */
  readonly videoTitle?: string;
}

/**
 * 찜 상태 응답
 */
interface FavoriteStatusResponse {
  readonly isFavorited: boolean;
  readonly favoriteId: string | null;
}

export type {
  ISOTimestamp,
  FavoriteDto,
  FavoriteWithContentDto,
  ToggleFavoriteParams,
  FavoriteStatusResponse,
};
