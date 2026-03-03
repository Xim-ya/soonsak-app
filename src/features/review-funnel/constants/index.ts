/**
 * 리뷰 퍼널 공통 상수
 */

/** 퍼널 배경 그라디언트 색상 */
export const FUNNEL_BACKGROUND_COLORS = ['#1a1a2e', '#16213e', '#0f0f0f'] as const;

/** 터치 영역 확장을 위한 hitSlop */
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** TMDB 이미지 베이스 URL */
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

/** 포스터 크기 */
export const POSTER_SIZE = {
  width: 100,
  height: 150,
} as const;

/** 랜덤 콘텐츠 관련 설정 */
export const CONTENT_CONFIG = {
  /** 화면에 표시할 콘텐츠 개수 */
  displayLimit: 3,
  /** DB에서 가져올 풀 사이즈 */
  fetchPoolSize: 20,
} as const;
