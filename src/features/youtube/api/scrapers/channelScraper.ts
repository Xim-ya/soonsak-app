/**
 * YouTube 채널 스크래퍼
 * 채널 페이지 HTML에서 채널 정보 추출
 *
 * TODO: 안정성 개선 필요
 * - 현재 HTML 스크래핑 방식은 YouTube 구조 변경에 취약함
 * - YouTube Data API v3 도입 검토 (공식 API, 일일 할당량 10,000 units)
 * - 또는 하이브리드 방식 (스크래핑 실패 시 API 폴백)
 */

import { ScrapedChannelDto, YouTubeApiError, YouTubeErrorCode } from '../../types';
import { parseAbbreviatedNumber } from '../../utils';
import { ScraperLogger } from '@/core/utils';

/**
 * 작업 분할 유틸리티 - UI 블로킹 방지
 */
const yieldToMain = (delay: number = 5): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

export const channelScraper = {
  /**
   * YouTube 채널 페이지에서 전체 데이터 스크래핑
   */
  async scrapeChannelPage(channelId: string): Promise<ScrapedChannelDto> {
    // channelId 타입에 따라 URL 형식 결정
    const baseUrl = channelId.startsWith('UC')
      ? `https://www.youtube.com/channel/${channelId}` // 실제 채널 ID
      : `https://www.youtube.com/${channelId}`; // handle ID (@channelname)

    // 동의 우회 파라미터 추가 (Android에서 Cookie 헤더가 무시되는 문제 해결)
    const url = `${baseUrl}?hl=ko&persist_hl=1&gl=KR`;

    ScraperLogger.log('🔍 채널 스크래핑 시작:', channelId);

    try {
      const response = await fetch(url, {
        headers: {
          // 데스크톱 Chrome UA로 변경 (모바일이 아닌 데스크톱 버전 요청)
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          // Android fetch가 gzip/br 자동 해제를 지원하지 않으므로 압축 비활성화
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          // 데스크톱 관련 헤더
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0', // 모바일 아님
          'sec-ch-ua-platform': '"Windows"',
          // YouTube 동의 쿠키 추가 (CONSENT 쿠키로 동의 화면 회피)
          Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+100',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new YouTubeApiError(
            `채널을 찾을 수 없습니다: ${channelId}`,
            YouTubeErrorCode.CHANNEL_NOT_FOUND,
          );
        }
        throw new YouTubeApiError(
          `채널 페이지 스크래핑 실패: ${response.status}`,
          YouTubeErrorCode.API_ERROR,
        );
      }

      const html = await response.text();

      return await this.extractChannelDataFromHtml(html);
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }
      ScraperLogger.error('❌ 채널 페이지 스크래핑 에러:', error);
      throw new YouTubeApiError(
        '채널 페이지 스크래핑 중 오류 발생',
        YouTubeErrorCode.PARSING_ERROR,
      );
    }
  },

  /**
   * HTML에서 채널 데이터 추출
   */
  async extractChannelDataFromHtml(html: string): Promise<ScrapedChannelDto> {
    const data: ScrapedChannelDto = {
      name: '',
      description: '',
      subscriberCount: 0,
      avatarUrl: '',
    };

    // 채널명 추출
    this.extractChannelName(html, data);
    await yieldToMain();

    // 구독자 수 추출
    this.extractSubscriberCount(html, data);
    await yieldToMain();

    // 채널 이미지들 추출
    this.extractChannelImages(html, data);
    await yieldToMain();

    // 채널 설명 추출
    this.extractChannelDescription(html, data);
    await yieldToMain();

    // 동영상 수 추출 (추가 정보)
    this.extractVideoCount(html, data);

    return data;
  },

  /**
   * 채널명 추출
   */
  extractChannelName(html: string, data: ScrapedChannelDto): void {
    // 최신 YouTube 구조에 맞는 채널명 패턴들 (우선순위 순)
    const namePatterns = [
      // 2024년 YouTube 구조: ytd-channel-name의 yt-formatted-string
      /<ytd-channel-name[^>]*>[\s\S]*?<yt-formatted-string[^>]*>([^<]+)<\/yt-formatted-string>/i,
      // 새로운 헤더 구조
      /<h1[^>]*class="[^"]*style-scope ytd-c4-tabbed-header-renderer[^"]*"[^>]*>[\s\S]*?<yt-formatted-string[^>]*>([^<]+)<\/yt-formatted-string>/i,
      // 기존 메인 헤더의 채널명
      /<h1[^>]*class="[^"]*dynamicTextViewModelH1[^"]*"[^>]*>[\s\S]*?<span[^>]*role="text"[^>]*>([^<]+)<\/span>/i,
      // 페이지 타이틀에서 추출
      /<title>([^-|]+?)(?:\s*-\s*YouTube)?<\/title>/i,
      // 메타데이터에서 추출 (우선순위)
      /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
      /<meta[^>]*name="twitter:title"[^>]*content="([^"]+)"/i,
      // JSON-LD에서 추출
      /"name":\s*"([^"]+)"/i,
      // 일반적인 채널 제목 패턴
      /class="[^"]*channel[^"]*title[^"]*"[^>]*>([^<]+)</i,
    ];

    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const name = match[1].trim();
        if (name && name !== 'YouTube') {
          data.name = name;
          return;
        }
      }
    }
  },

  /**
   * 구독자 수 추출
   */
  extractSubscriberCount(html: string, data: ScrapedChannelDto): void {
    // 최신 YouTube 구조에 맞는 구독자 수 패턴들
    const subscriberPatterns = [
      // 2024년 최신 구조: ytd-c4-tabbed-header-renderer 내부
      /<ytd-c4-tabbed-header-renderer[^>]*>[\s\S]*?구독자\s*([0-9만천억.KMB]+)[\s\S]*?<\/ytd-c4-tabbed-header-renderer>/i,
      // 새로운 subscriber 텍스트 패턴
      /"subscriberCountText":\s*\{\s*"accessibility":\s*\{\s*"accessibilityData":\s*\{\s*"label":\s*"구독자\s*([^"]*?)명"/i,
      /"subscriberCountText":\s*\{\s*"simpleText":\s*"구독자\s*([^"]+?)명"/i,
      // JSON 데이터에서 추출 (개선)
      /"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/i,
      /"subscriberCountText":\s*"([^"]+)"/i,
      // 한국어 패턴 (더 정확한)
      /구독자\s*([0-9만천억.,\s]+)명/i,
      /구독자\s*([^\s<]+)/i,
      /subscribers?\s*([^\s<]+)/i,
      // 메타데이터 패턴 (순서 변경)
      /([0-9.]+[KMB만천억]+)\s*(?:명|subscribers?)/i,
      // 구독자 관련 aria-label 개선
      /aria-label="[^"]*구독자[^"]*?([0-9,.]+[만천억KMB]?)[^"]*명[^"]*"/i,
    ];

    for (const pattern of subscriberPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const subscriberText = match[1].trim();
        const subscriberData = this.parseSubscriberCount(subscriberText);

        if (subscriberData.count > 0) {
          data.subscriberCount = subscriberData.count;
          if (subscriberData.text) {
            data.subscriberText = subscriberData.text;
          }
          return;
        }
      }
    }
  },

  /**
   * 채널 이미지들 추출 (아바타, 배너)
   */
  extractChannelImages(html: string, data: ScrapedChannelDto): void {
    // 아바타 이미지 패턴들
    const avatarPatterns = [
      /yt3\.googleusercontent\.com\/[^"]*=s160[^"]*/g,
      /yt3\.googleusercontent\.com\/[^"]*=s\d+[^"]*/g,
    ];

    for (const pattern of avatarPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        data.avatarUrl = 'https://' + matches[0];
        break;
      }
    }

    // 배너 이미지 패턴들
    const bannerPatterns = [
      /yt3\.googleusercontent\.com\/[^"]*=w2560[^"]*/g,
      /yt3\.googleusercontent\.com\/[^"]*=w\d+[^"]*/g,
    ];

    for (const pattern of bannerPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        data.bannerUrl = 'https://' + matches[0];
        break;
      }
    }
  },

  /**
   * 채널 설명 추출
   */
  extractChannelDescription(html: string, data: ScrapedChannelDto): void {
    // 설명 패턴들
    const descriptionPatterns = [
      // 메인 설명 (truncated-text 내부)
      /<span[^>]*class="[^"]*yt-core-attributed-string[^"]*"[^>]*role="text"[^>]*>([^<]+)<\/span>(?:[^<]*<button[^>]*>[\s\S]*?더보기)/i,
      // JSON-LD에서 추출
      /"description":\s*"([^"]+)"/i,
      // 메타데이터에서 추출
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
      /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
      // 일반적인 채널 설명 패턴
      /class="[^"]*channel[^"]*description[^"]*"[^>]*>([^<]+)</i,
    ];

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const description = match[1].trim();
        if (description && description.length > 5) {
          data.description = this.cleanDescription(description);
          return;
        }
      }
    }
  },

  /**
   * 동영상 수 추출 (추가 정보)
   */
  extractVideoCount(html: string, data: ScrapedChannelDto): void {
    // 동영상 수 패턴들
    const videoCountPatterns = [
      /동영상\s*([0-9,]+)개/i,
      /videos?\s*([0-9,]+)/i,
      /"videoCountText":\s*"([^"]+)"/i,
      /(\d+(?:[,\d]*)?)\s*(?:개|videos?)/i,
    ];

    for (const pattern of videoCountPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const videoCountText = match[1].trim();
        const count = parseInt(videoCountText.replace(/,/g, ''));
        if (count > 0) {
          data.videoCount = count;
          return;
        }
      }
    }
  },

  /**
   * 구독자 수 텍스트 파싱
   */
  parseSubscriberCount(text: string): { count: number; text?: string } {
    if (!text) return { count: 0 };

    // 한국어 축약 (15만명, 3천명)
    const koreanMatch = text.match(/([0-9.]+)([만천억])/);
    if (koreanMatch) {
      const num = parseFloat(koreanMatch[1]!);
      const unit = koreanMatch[2]!;
      const multiplier =
        {
          천: 1000,
          만: 10000,
          억: 100000000,
        }[unit] || 1;

      return {
        count: Math.floor(num * multiplier),
        text: koreanMatch[0],
      };
    }

    // 영어 축약 (1.5M, 150K)
    const englishMatch = text.match(/([0-9.]+)([KMB])/i);
    if (englishMatch) {
      return {
        count: parseAbbreviatedNumber(englishMatch[0]!),
        text: englishMatch[0],
      };
    }

    // 일반 숫자 (콤마 포함)
    const numMatch = text.match(/([0-9,]+)/);
    if (numMatch) {
      const count = parseInt(numMatch[1]!.replace(/,/g, ''));
      if (count > 0) {
        return { count };
      }
    }

    return { count: 0 };
  },

  /**
   * 설명 텍스트 정리
   */
  cleanDescription(description: string): string {
    return description
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .replace(/\\n/g, '\n') // 이스케이프된 줄바꿈 복원
      .replace(/\\"/g, '"') // 이스케이프된 따옴표 복원
      .trim();
  },
};
