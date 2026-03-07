/**
 * YouTube 데이터 포맷팅 유틸리티
 */

import { YouTubeLogger } from '@/core/utils';

/**
 * YouTube ISO 8601 duration을 MM:SS 또는 HH:MM:SS 형식으로 변환
 * @param isoDuration ISO 8601 형식 (예: PT10M30S)
 * @returns 포맷된 시간 문자열 (예: 10:30)
 */
export const formatYouTubeDuration = (isoDuration: string): string => {
  if (!isoDuration) return '0:00';

  try {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return isoDuration;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    YouTubeLogger.error('Duration 파싱 실패:', error);
    return '0:00';
  }
};

/**
 * 초 단위를 MM:SS 또는 HH:MM:SS 형식으로 변환
 * @param totalSeconds 총 초
 * @returns 포맷된 시간 문자열
 */
export const formatSecondsToTime = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * 한국어/영어 축약 숫자를 실제 숫자로 변환
 * @param text 축약된 숫자 텍스트 (예: "6.2천", "1.5만", "3.2K", "1.5M")
 * @returns 변환된 숫자
 */
export const parseAbbreviatedNumber = (text: string): number => {
  if (!text || typeof text !== 'string') return 0;

  // 쉼표 제거
  const cleanText = text.replace(/,/g, '').trim();

  // 한국어 단위 (천, 만, 억)
  const koreanMatch = cleanText.match(/^(\d+(?:\.\d+)?)\s*([천만억])$/);
  if (koreanMatch?.[1] && koreanMatch[2]) {
    const baseNumber = parseFloat(koreanMatch[1]);
    const unit = koreanMatch[2];

    switch (unit) {
      case '천':
        return Math.round(baseNumber * 1000);
      case '만':
        return Math.round(baseNumber * 10000);
      case '억':
        return Math.round(baseNumber * 100000000);
    }
  }

  // 영어 단위 (K, M, B)
  const englishMatch = cleanText.match(/^(\d+(?:\.\d+)?)\s*([KMBkmb])$/i);
  if (englishMatch?.[1] && englishMatch[2]) {
    const baseNumber = parseFloat(englishMatch[1]);
    const unit = englishMatch[2].toUpperCase();

    switch (unit) {
      case 'K':
        return Math.round(baseNumber * 1000);
      case 'M':
        return Math.round(baseNumber * 1000000);
      case 'B':
        return Math.round(baseNumber * 1000000000);
    }
  }

  // 일반 숫자
  const number = parseInt(cleanText);
  return isNaN(number) ? 0 : number;
};

/**
 * 숫자를 축약 형식으로 변환
 * @param num 숫자
 * @param korean 한국어 형식 사용 여부
 * @returns 축약된 문자열
 */
export const formatNumberToAbbreviated = (num: number, korean: boolean = true): string => {
  if (num < 1000) return num.toString();

  if (korean) {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}만`;
    }
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}천`;
  } else {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
};

/**
 * 날짜 문자열을 상대적 시간으로 변환
 * @param dateString ISO 8601 날짜 문자열
 * @returns 상대적 시간 (예: "3일 전", "2개월 전")
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears}년 전`;
    }
    if (diffMonths > 0) {
      return `${diffMonths}개월 전`;
    }
    if (diffDays > 0) {
      return `${diffDays}일 전`;
    }
    if (diffHours > 0) {
      return `${diffHours}시간 전`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes}분 전`;
    }
    return '방금 전';
  } catch (error) {
    YouTubeLogger.error('날짜 파싱 실패:', error);
    return '';
  }
};
