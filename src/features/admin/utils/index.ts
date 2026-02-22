/**
 * Admin Utils
 *
 * 어드민 기능에서 공통으로 사용되는 유틸리티 함수
 */

import type { UserRole } from '@/features/auth/types';
import colors from '@/shared/styles/colors';

// ============================================================================
// Role Utilities
// ============================================================================

/**
 * 역할별 색상 반환
 *
 * @param role - 유저 역할
 * @param options - 옵션 (defaultColor: user 역할의 기본 색상)
 * @returns 역할에 해당하는 색상
 */
export function getRoleColor(
  role: UserRole,
  options?: { defaultColor?: string },
): string {
  const { defaultColor = colors.gray02 } = options ?? {};

  switch (role) {
    case 'admin':
      return colors.primary;
    case 'banned':
      return colors.red;
    case 'user':
    default:
      return defaultColor;
  }
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/** 유효하지 않은 날짜 대체 문자열 */
const INVALID_DATE_PLACEHOLDER = '-';

/**
 * 날짜 문자열이 유효한지 검증
 */
function isValidDateString(isoDate: unknown): isoDate is string {
  if (!isoDate || typeof isoDate !== 'string') return false;
  const date = new Date(isoDate);
  return !Number.isNaN(date.getTime());
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 *
 * @param isoDate - ISO 형식 날짜 문자열
 * @returns YYYY.MM.DD 형식 문자열. 유효하지 않은 날짜인 경우 '-' 반환
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isValidDateString(isoDate)) return INVALID_DATE_PLACEHOLDER;

  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * ISO 날짜 문자열을 YYYY.MM.DD HH:mm 형식으로 변환
 *
 * @param isoDate - ISO 형식 날짜 문자열
 * @returns YYYY.MM.DD HH:mm 형식 문자열. 유효하지 않은 날짜인 경우 '-' 반환
 */
export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isValidDateString(isoDate)) return INVALID_DATE_PLACEHOLDER;

  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

// ============================================================================
// Number Formatting Utilities
// ============================================================================

/**
 * 숫자 포맷팅 (1000 -> 1K, 1000000 -> 1M)
 *
 * @param num - 포맷할 숫자
 * @returns 포맷된 문자열. 유효하지 않은 숫자인 경우 '0' 반환
 */
export function formatCompactNumber(num: number | null | undefined): string {
  // 유효하지 않은 숫자 처리
  if (num == null || !Number.isFinite(num) || num < 0) {
    return '0';
  }

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return Math.floor(num).toString();
}

// ============================================================================
// YouTube URL Parsing Utilities
// ============================================================================

/**
 * YouTube 영상 URL 파싱 결과
 */
export interface YouTubeVideoParseResult {
  success: boolean;
  videoId: string | null;
  error?: string;
}

/**
 * YouTube 채널 URL 파싱 결과
 */
export interface YouTubeChannelParseResult {
  success: boolean;
  channelId: string | null;
  channelHandle: string | null;
  type: 'id' | 'handle' | null;
  error?: string;
}

/**
 * YouTube 영상 URL에서 Video ID 추출
 *
 * 지원하는 URL 형식:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 *
 * @param url - YouTube 영상 URL
 * @returns 파싱 결과 (videoId 또는 에러)
 */
export function parseYouTubeVideoUrl(url: string): YouTubeVideoParseResult {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { success: false, videoId: null, error: 'URL이 비어있습니다' };
  }

  // YouTube Video ID 정규식 패턴 (11자리 영숫자 + 특수문자)
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

  // URL 파싱 시도
  try {
    const urlObj = new URL(trimmedUrl);
    const hostname = urlObj.hostname.replace('www.', '');
    let videoId: string | null = null;

    // youtube.com/watch?v=VIDEO_ID
    if (hostname === 'youtube.com' && urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    }
    // youtu.be/VIDEO_ID
    else if (hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    }
    // youtube.com/embed/VIDEO_ID 또는 /v/VIDEO_ID 또는 /shorts/VIDEO_ID
    else if (hostname === 'youtube.com') {
      const pathMatch = urlObj.pathname.match(/^\/(embed|v|shorts)\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) {
        videoId = pathMatch[2] ?? null;
      }
    }

    // Video ID 유효성 검사
    if (videoId && videoIdPattern.test(videoId)) {
      return { success: true, videoId };
    }

    return {
      success: false,
      videoId: null,
      error: '유효한 YouTube 영상 URL이 아닙니다',
    };
  } catch {
    return {
      success: false,
      videoId: null,
      error: '잘못된 URL 형식입니다',
    };
  }
}

/**
 * YouTube 채널 URL에서 Channel ID 또는 Handle 추출
 *
 * 지원하는 URL 형식:
 * - https://www.youtube.com/channel/CHANNEL_ID
 * - https://www.youtube.com/@HANDLE
 * - https://www.youtube.com/c/CUSTOM_NAME (레거시 - 핸들로 처리)
 * - https://www.youtube.com/user/USERNAME (레거시 - 핸들로 처리)
 *
 * @param url - YouTube 채널 URL
 * @returns 파싱 결과 (channelId/channelHandle 또는 에러)
 */
export function parseYouTubeChannelUrl(url: string): YouTubeChannelParseResult {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return {
      success: false,
      channelId: null,
      channelHandle: null,
      type: null,
      error: 'URL이 비어있습니다',
    };
  }

  // Channel ID 정규식 패턴 (UC로 시작하는 24자리)
  const channelIdPattern = /^UC[a-zA-Z0-9_-]{22}$/;

  // URL 파싱 시도
  try {
    const urlObj = new URL(trimmedUrl);
    const hostname = urlObj.hostname.replace('www.', '');

    if (hostname !== 'youtube.com') {
      return {
        success: false,
        channelId: null,
        channelHandle: null,
        type: null,
        error: '유효한 YouTube 채널 URL이 아닙니다',
      };
    }

    const pathname = urlObj.pathname;

    // @HANDLE 형식
    if (pathname.startsWith('/@')) {
      const handle = pathname.slice(2).split('/')[0];
      if (handle && handle.length > 0) {
        return {
          success: true,
          channelId: null,
          channelHandle: handle,
          type: 'handle',
        };
      }
    }

    // /channel/CHANNEL_ID 형식
    if (pathname.startsWith('/channel/')) {
      const channelId = pathname.slice(9).split('/')[0];
      if (channelId && channelIdPattern.test(channelId)) {
        return {
          success: true,
          channelId,
          channelHandle: null,
          type: 'id',
        };
      }
    }

    // /c/CUSTOM_NAME 또는 /user/USERNAME 형식 (레거시)
    const legacyMatch = pathname.match(/^\/(c|user)\/([^/]+)/);
    if (legacyMatch && legacyMatch[2]) {
      return {
        success: true,
        channelId: null,
        channelHandle: legacyMatch[2],
        type: 'handle',
      };
    }

    return {
      success: false,
      channelId: null,
      channelHandle: null,
      type: null,
      error: '유효한 YouTube 채널 URL이 아닙니다',
    };
  } catch {
    return {
      success: false,
      channelId: null,
      channelHandle: null,
      type: null,
      error: '잘못된 URL 형식입니다',
    };
  }
}

/**
 * 여러 줄의 YouTube 영상 URL을 파싱
 *
 * @param text - 줄바꿈으로 구분된 YouTube URL 목록
 * @returns 각 URL의 파싱 결과 배열
 */
export function parseMultipleVideoUrls(
  text: string,
): Array<{ url: string; result: YouTubeVideoParseResult }> {
  const lines = text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((url) => ({
    url,
    result: parseYouTubeVideoUrl(url),
  }));
}
