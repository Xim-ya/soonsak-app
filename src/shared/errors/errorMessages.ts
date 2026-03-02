import { ERROR_CODES, type ErrorCode } from './errorCodes';

/**
 * 에러 코드별 사용자 메시지
 *
 * 스낵바에 표시될 메시지입니다.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 공통
  [ERROR_CODES.UNKNOWN]: '알 수 없는 오류가 발생했어요',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요',
  [ERROR_CODES.TIMEOUT]: '요청 시간이 초과됐어요',

  // 인증
  [ERROR_CODES.USER_CANCELLED]: '취소했어요',
  [ERROR_CODES.AUTH_CANCELLED]: '로그인을 취소했어요',
  [ERROR_CODES.AUTH_FAILED]: '로그인하지 못했어요',
  [ERROR_CODES.GOOGLE_PLAY_NOT_AVAILABLE]: 'Google Play 서비스를 업데이트해주세요',

  // 콘텐츠
  [ERROR_CODES.CONTENT_FETCH_ERROR]: '콘텐츠를 불러오지 못했어요',
  [ERROR_CODES.CONTENT_NOT_FOUND]: '콘텐츠를 찾지 못했어요',
  [ERROR_CODES.VIDEO_FETCH_ERROR]: '영상을 불러오지 못했어요',
  [ERROR_CODES.SEARCH_ERROR]: '검색하지 못했어요',

  // 채널
  [ERROR_CODES.CHANNEL_FETCH_ERROR]: '채널 정보를 불러오지 못했어요',

  // TMDB
  [ERROR_CODES.TMDB_FETCH_ERROR]: '콘텐츠 정보를 불러오지 못했어요',

  // YouTube
  [ERROR_CODES.YOUTUBE_INVALID_URL]: '유효하지 않은 YouTube URL이에요',
  [ERROR_CODES.YOUTUBE_FETCH_ERROR]: 'YouTube 정보를 불러오지 못했어요',

  // 댓글
  [ERROR_CODES.COMMENT_FETCH_ERROR]: '댓글을 불러오지 못했어요',
};

/**
 * 에러 코드로 메시지 조회
 *
 * @param code - 에러 코드
 * @returns 사용자 메시지 (없으면 기본 메시지)
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as ErrorCode] ?? ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
}
