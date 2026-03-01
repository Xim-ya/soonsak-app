import type { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * ISO 8601 형식의 타임스탬프 문자열 타입
 */
type ISOTimestamp = string;

/**
 * ISO 8601 형식의 날짜 문자열 타입 (YYYY-MM-DD)
 */
type ISODate = string;

/**
 * 시청 기록 DTO
 * watch_history 테이블과 1대1 대응
 * user_id + content_id로 유니크 (한 유저당 한 콘텐츠에 하나의 기록)
 */
interface WatchHistoryDto {
  readonly id: string;
  readonly userId: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
  /** 마지막 시청 시간 */
  readonly lastWatchedAt: ISOTimestamp;
  readonly createdAt: ISOTimestamp;
  /** 전체 시청 여부 (95% 이상 시청 또는 남은 10초 이하, 한번 true면 유지) */
  readonly isFullyWatched: boolean;
}

/**
 * 시청 기록 + 콘텐츠 정보 조인 DTO
 * 캘린더 및 시청 기록 목록에서 포스터 이미지를 표시할 때 사용
 */
interface WatchHistoryWithContentDto extends WatchHistoryDto {
  readonly contentTitle: string;
  readonly contentPosterPath: string;
  readonly contentBackdropPath: string;
  readonly progressSeconds: number;
  readonly durationSeconds: number;
}

/**
 * 시청 진행률 업데이트 파라미터
 */
interface UpdateWatchProgressParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
  readonly progressSeconds: number;
  readonly durationSeconds: number;
}

/**
 * 캘린더용 날짜별 시청 기록 집계 DTO
 */
interface WatchHistoryCalendarItemDto {
  readonly watchedDate: ISODate;
  readonly count: number;
  readonly firstPosterPath: string;
  readonly contentIds: number[];
}

/**
 * 월별 시청 기록 요약 DTO
 */
interface MonthlyWatchSummaryDto {
  readonly year: number;
  readonly month: number;
  readonly totalCount: number;
  readonly uniqueContents: number;
}

/**
 * 시청 기록 생성 파라미터
 */
interface CreateWatchHistoryParams {
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
}

export type {
  ISOTimestamp,
  ISODate,
  WatchHistoryDto,
  WatchHistoryWithContentDto,
  WatchHistoryCalendarItemDto,
  MonthlyWatchSummaryDto,
  CreateWatchHistoryParams,
  UpdateWatchProgressParams,
};
