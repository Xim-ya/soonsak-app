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
