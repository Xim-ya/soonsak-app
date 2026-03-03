/**
 * YouTube 페이지 스크래퍼
 * 페이지 HTML에서 추가 메타데이터 추출
 *
 * TODO: 안정성 개선 필요
 * - 현재 HTML 스크래핑 방식은 YouTube 구조 변경에 취약함
 * - YouTube Data API v3 도입 검토 (공식 API, 일일 할당량 10,000 units)
 * - 또는 하이브리드 방식 (스크래핑 실패 시 API 폴백)
 */

import { ScrapedVideoDto, YouTubeApiError, YouTubeErrorCode } from '../../types';
import { parseAbbreviatedNumber, formatYouTubeDuration } from '../../utils';

// 스키마 기반 데이터 추출 타입
interface InteractionStatistic {
  '@type': string;
  interactionType: string;
  userInteractionCount: number;
}

/**
 * 작업 분할 유틸리티 - UI 블로킹 방지
 */
const yieldToMain = (delay: number = 5): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

export const pageScraper = {
  /**
   * YouTube 페이지에서 전체 데이터 스크래핑
   */
  async scrapeVideoPage(videoId: string): Promise<ScrapedVideoDto> {
    // 동의 우회 파라미터 추가 (Android에서 Cookie 헤더가 무시되는 문제 해결)
    const url = `https://www.youtube.com/watch?v=${videoId}&hl=ko&persist_hl=1&gl=KR`;

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
        throw new YouTubeApiError(
          `페이지 스크래핑 실패: ${response.status}`,
          YouTubeErrorCode.API_ERROR,
        );
      }

      const html = await response.text();

      return await this.extractDataFromHtml(html);
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }
      console.error('❌ 페이지 스크래핑 에러:', error);
      throw new YouTubeApiError('페이지 스크래핑 중 오류 발생', YouTubeErrorCode.PARSING_ERROR);
    }
  },

  /**
   * 메트릭스만 빠르게 스크래핑
   */
  async scrapeMetrics(
    videoId: string,
  ): Promise<Pick<ScrapedVideoDto, 'viewCount' | 'likeCount' | 'likeText' | 'uploadDate'>> {
    const fullData = await this.scrapeVideoPage(videoId);
    return {
      viewCount: fullData.viewCount,
      likeCount: fullData.likeCount,
      ...(fullData.likeText && { likeText: fullData.likeText }),
      uploadDate: fullData.uploadDate,
    };
  },

  /**
   * HTML에서 데이터 추출
   */
  async extractDataFromHtml(html: string): Promise<ScrapedVideoDto> {
    const data: ScrapedVideoDto = {
      viewCount: 0,
      likeCount: 0,
      uploadDate: '', // 빈 값으로 초기화, JSON-LD에서 추출된 값으로 덮어씀
      duration: '0:00',
    };

    // JSON-LD 구조화 데이터 추출 (microformat에서)
    // TODO: 개선 필요 - YouTube가 프로그래밍 방식 접근을 감지하여 JSON-LD 제공 안 함
    // 병목: YouTube는 실제 브라우저와 fetch 요청을 구분하여 다른 HTML 제공
    // - 브라우저: JavaScript 실행 후 동적으로 JSON-LD 삽입
    // - fetch: 초기 HTML만 제공, JSON-LD 없음
    // 향후 개선 방안:
    // 1. WebView를 통한 실제 브라우저 렌더링 후 데이터 추출
    // 2. YouTube Data API v3 사용 (공식 방법)
    // 3. ytInitialData/ytInitialPlayerResponse 파싱
    // this.extractMicroformatJsonLd(html, data);
    // await yieldToMain();

    // HTML에서 직접 업로드 날짜 추출 (백업)
    if (!data.uploadDate) {
      this.extractUploadDateFromHtml(html, data);
    }
    await yieldToMain();

    // ytInitialData에서 추가 데이터 추출 (좋아요수 백업)
    if (!data.likeCount) {
      this.extractYtInitialData(html, data);
      await yieldToMain();
    }

    // 강화된 메타데이터 추출 (백업)
    if (!data.likeCount || !data.viewCount) {
      this.extractEnhancedMetadata(html, data);
      await yieldToMain();
    }

    // 메타데이터에서 추가 정보 추출 (조회수/길이 백업)
    this.extractMetadata(html, data);

    return data;
  },

  /**
   * microformat JSON-LD에서 정확한 데이터 추출
   * @deprecated YouTube가 fetch 요청에 JSON-LD를 제공하지 않음
   * TODO: WebView 또는 YouTube Data API v3로 대체 필요
   */
  extractMicroformatJsonLd(html: string, data: ScrapedVideoDto): void {
    // 여러 가지 JSON-LD 패턴 시도 (nonce 속성 등을 고려한 더 유연한 패턴)
    const patterns = [
      // 가장 유연한 패턴 (어떤 속성이든 허용) - nonce 포함
      /<script[^>]*type=["']application\/ld\+json["'][^>]*nonce=["'][^"']*["'][^>]*>([\s\S]*?)<\/script>/gi,
      /<script[^>]*nonce=["'][^"']*["'][^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      // 기존 패턴들 (nonce 없는 경우)
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      /<script[^>]*\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ];

    let jsonLdMatches = null;

    for (const pattern of patterns) {
      jsonLdMatches = html.match(pattern);
      if (jsonLdMatches && jsonLdMatches.length > 0) {
        console.log(
          `🔍 JSON-LD 스크립트 ${jsonLdMatches.length}개 발견 (패턴: ${pattern.source.substring(0, 50)}...)`,
        );
        break;
      } else {
        console.log(`❌ 패턴 실패: ${pattern.source.substring(0, 50)}...`);
      }
    }

    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      // HTML에서 JSON-LD 관련 텍스트 존재 여부 확인
      const hasJsonLd = html.includes('application/ld+json');
      const hasMicroformat = html.includes('microformat');
      const hasVideoObject = html.includes('"@type":"VideoObject"');

      console.log('❌ JSON-LD 스크립트를 찾을 수 없습니다');
      console.log('🔍 디버깅 정보:');
      console.log('  - application/ld+json 포함:', hasJsonLd);
      console.log('  - microformat 포함:', hasMicroformat);
      console.log('  - VideoObject 포함:', hasVideoObject);

      // 실제 script 태그가 있는지 직접 확인하고 로그 출력
      if (hasJsonLd) {
        console.log('🔍 실제 script 태그 찾기 시도...');

        // 더 간단한 패턴으로 script 태그 찾기 (nonce 속성 포함)
        const simplePatterns = [
          /<script[^>]*application\/ld\+json[^>]*nonce[^>]*>[\s\S]*?<\/script>/gi,
          /<script[^>]*nonce[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi,
          /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi,
        ];

        let simpleScriptMatch = null;
        for (const pattern of simplePatterns) {
          simpleScriptMatch = html.match(pattern);
          if (simpleScriptMatch && simpleScriptMatch.length > 0) {
            console.log(
              `🎯 간단한 패턴 매치 (${pattern.source.substring(0, 30)}...): ${simpleScriptMatch.length}개`,
            );
            break;
          }
        }
        if (simpleScriptMatch) {
          console.log(`🎯 간단한 패턴으로 ${simpleScriptMatch.length}개 script 태그 발견!`);
          simpleScriptMatch.forEach((script, index) => {
            const shortScript = script.length > 200 ? script.substring(0, 200) + '...' : script;
            console.log(`📋 Script ${index + 1}:`, shortScript);
          });

          // 첫 번째 스크립트에서 JSON 추출 시도
          if (simpleScriptMatch[0]) {
            const jsonContent = simpleScriptMatch[0].match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            if (jsonContent?.[1]) {
              try {
                // JSON 문자열 정리 (제어 문자 처리)
                const cleanJsonString = jsonContent[1].trim();
                console.log('📋 JSON-LD 원본 (첫 300자):', cleanJsonString.substring(0, 300));
                console.log(
                  '📋 JSON-LD 원본 (마지막 100자):',
                  cleanJsonString.substring(cleanJsonString.length - 100),
                );

                // 안전하게 JSON 파싱 (제어 문자는 그대로 유지 - Node.js는 JSON 내부의 실제 줄바꿈을 처리할 수 있음)
                const jsonData = JSON.parse(cleanJsonString);
                if (jsonData['@type'] === 'VideoObject') {
                  console.log('🎯 VideoObject 발견! 직접 파싱 시도');
                  // 조회수 추출
                  if (jsonData.interactionStatistic) {
                    const viewStat = jsonData.interactionStatistic.find(
                      (stat: InteractionStatistic) =>
                        stat.interactionType === 'https://schema.org/WatchAction',
                    );
                    const likeStat = jsonData.interactionStatistic.find(
                      (stat: InteractionStatistic) =>
                        stat.interactionType === 'https://schema.org/LikeAction',
                    );

                    if (viewStat?.userInteractionCount) {
                      data.viewCount = parseInt(viewStat.userInteractionCount.toString());
                      console.log('✅ 직접 추출 조회수:', data.viewCount);
                    }

                    if (likeStat?.userInteractionCount) {
                      data.likeCount = parseInt(likeStat.userInteractionCount.toString());
                      console.log('✅ 직접 추출 좋아요수:', data.likeCount);
                    }
                  }

                  // 기타 데이터
                  if (jsonData.uploadDate) {
                    data.uploadDate = new Date(jsonData.uploadDate).toISOString();
                    console.log('✅ 직접 추출 업로드일:', jsonData.uploadDate.split('T')[0]);
                  }

                  if (jsonData.duration) {
                    data.duration = formatYouTubeDuration(jsonData.duration);
                    console.log('✅ 직접 추출 영상 길이:', data.duration);
                  }

                  if (jsonData.description) {
                    data.description = jsonData.description;
                  }

                  if (jsonData.author) {
                    data.channelName =
                      typeof jsonData.author === 'string' ? jsonData.author : jsonData.author.name;
                  }

                  return; // 성공적으로 추출했으므로 종료
                }
              } catch (error) {
                console.log('❌ 직접 JSON 파싱 실패:', error);
              }
            }
          }
        } else {
          console.log('❌ 간단한 패턴으로도 script 태그를 찾을 수 없음');

          // HTML 샘플 출력 (디버깅용)
          const jsonLdIndex = html.indexOf('application/ld+json');
          if (jsonLdIndex !== -1) {
            const startIndex = Math.max(0, jsonLdIndex - 100);
            const endIndex = Math.min(html.length, jsonLdIndex + 500);
            const sample = html.substring(startIndex, endIndex);
            console.log('🔍 application/ld+json 주변 HTML:', sample);
          }
        }
      }

      if (hasVideoObject) {
        console.log('🎯 VideoObject가 HTML에 있습니다. 기존 방식으로 직접 추출을 시도합니다.');
        this.extractVideoObjectDirectly(html, data);
      }
      return;
    }

    console.log(`🔍 JSON-LD 스크립트 ${jsonLdMatches.length}개 발견`);

    let jsonLdData = null;

    // 각 JSON-LD 스크립트에서 VideoObject 찾기
    for (let i = 0; i < jsonLdMatches!.length; i++) {
      const fullMatch = jsonLdMatches![i];
      // 스크립트 태그 내부 JSON 내용만 추출 (더 유연한 패턴 사용)
      const scriptContent = fullMatch?.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (!scriptContent || !scriptContent[1]) continue;

      try {
        // JSON 문자열 정리 (제어 문자 처리)
        const cleanJsonString = scriptContent[1].trim();
        console.log(`📋 메인 JSON-LD ${i + 1} 원본 (첫 300자):`, cleanJsonString.substring(0, 300));
        const jsonLd = JSON.parse(cleanJsonString);
        console.log(`📋 JSON-LD ${i + 1} 타입:`, jsonLd['@type']);

        if (jsonLd['@type'] === 'VideoObject') {
          jsonLdData = jsonLd;
          console.log('🎯 VideoObject JSON-LD 발견!');
          break;
        }
      } catch (error) {
        console.log(`❌ JSON-LD ${i + 1} 파싱 실패:`, error);
      }
    }

    if (!jsonLdData) {
      console.log('❌ VideoObject 타입의 JSON-LD를 찾을 수 없습니다');
      return;
    }

    try {
      const jsonLd = jsonLdData;
      console.log('🎯 JSON-LD 데이터 파싱 성공!');

      // VideoObject 타입 확인
      if (jsonLd['@type'] === 'VideoObject') {
        // 정확한 조회수 추출 (WatchAction)
        if (jsonLd.interactionStatistic) {
          const viewStat = jsonLd.interactionStatistic.find(
            (stat: InteractionStatistic) =>
              stat.interactionType === 'https://schema.org/WatchAction',
          );
          if (viewStat?.userInteractionCount) {
            data.viewCount = parseInt(viewStat.userInteractionCount.toString());
            console.log('✅ 정확한 조회수:', data.viewCount);
          }

          // 정확한 좋아요수 추출 (LikeAction)
          const likeStat = jsonLd.interactionStatistic.find(
            (stat: InteractionStatistic) =>
              stat.interactionType === 'https://schema.org/LikeAction',
          );
          if (likeStat?.userInteractionCount) {
            data.likeCount = parseInt(likeStat.userInteractionCount.toString());
            console.log('✅ 정확한 좋아요수:', data.likeCount);
          }
        }

        // 업로드 날짜
        if (jsonLd.uploadDate) {
          data.uploadDate = new Date(jsonLd.uploadDate).toISOString();
          console.log('✅ 업로드일:', jsonLd.uploadDate.split('T')[0]);
        }

        // 영상 길이
        if (jsonLd.duration) {
          data.duration = formatYouTubeDuration(jsonLd.duration);
          console.log('✅ 영상 길이:', data.duration);
        }

        // 설명
        if (jsonLd.description) {
          data.description = jsonLd.description;
        }

        // 채널명
        if (jsonLd.author) {
          data.channelName = typeof jsonLd.author === 'string' ? jsonLd.author : jsonLd.author.name;
        }
      }
    } catch (error) {
      console.log('❌ JSON-LD 데이터 처리 실패:', error);
    }
  },

  /**
   * ytInitialData에서 데이터 추출 (기본)
   */
  extractYtInitialData(html: string, data: ScrapedVideoDto): void {
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*({[\s\S]*?});/);
    if (!ytDataMatch || !ytDataMatch[1]) {
      console.log('❌ 기본 ytInitialData 패턴을 찾을 수 없음');
      return;
    }

    try {
      const ytData = JSON.parse(ytDataMatch[1]);
      console.log('🎯 기본 ytInitialData 파싱 성공');
      this.extractFromYtData(ytData, data);

      // 채널 정보 추출
      const channelInfo =
        ytData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]
          ?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer;

      if (channelInfo) {
        const channelTitle = channelInfo.title?.runs?.[0]?.text;
        if (channelTitle) {
          data.channelName = channelTitle;
        }
      }
    } catch (error) {
      console.log('❌ 기본 ytInitialData 파싱 실패:', error);
    }
  },

  /**
   * 메타데이터에서 추가 정보 추출
   */
  extractMetadata(html: string, data: ScrapedVideoDto): void {
    // 조회수가 없으면 메타데이터에서 추출
    if (!data.viewCount) {
      const viewCountMatch = html.match(/"viewCount":"(\d+)"/);
      if (viewCountMatch?.[1]) {
        data.viewCount = parseInt(viewCountMatch[1]);
        console.log('✅ 메타데이터 조회수:', data.viewCount);
      }
    }

    // 영상 길이 추출 (duration이 없으면)
    if (!data.duration || data.duration === '0:00') {
      const durationPatterns = [
        /"lengthSeconds":"(\d+)"/, // 초 단위
        /"duration":"PT(\d+)M(\d+)S"/, // ISO 8601 형식
        /"approxDurationMs":"(\d+)"/, // 밀리초 단위
      ];

      for (const pattern of durationPatterns) {
        const match = html.match(pattern);
        if (match) {
          if (pattern.source.includes('lengthSeconds')) {
            const seconds = parseInt(match[1] || '0');
            data.duration = this.formatSecondsToTime(seconds);
            console.log('✅ 메타데이터 길이 (초):', seconds, '→', data.duration);
            break;
          } else if (pattern.source.includes('approxDurationMs')) {
            const ms = parseInt(match[1] || '0');
            const seconds = Math.floor(ms / 1000);
            data.duration = this.formatSecondsToTime(seconds);
            console.log('✅ 메타데이터 길이 (ms):', ms, '→', data.duration);
            break;
          }
        }
      }
    }

    // 좋아요수가 없으면 다양한 방법으로 추출
    if (!data.likeCount) {
      // 1. 정확한 숫자 패턴 우선 시도
      const exactLikePatterns = [
        /"likeCount":(\d+)/, // 정확한 숫자 필드
        /"likeCountIfIndifferent":(\d+)/,
        /"likeCountWithoutText":(\d+)/,
        /"rawLikeCount":(\d+)/,
        /"userInteractionCount":"(\d+)"/, // Schema.org 형식
      ];

      for (const pattern of exactLikePatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          const count = parseInt(match[1]);
          if (count > 0 && count < 100000000) {
            data.likeCount = count;
            console.log('✅ 정확한 좋아요수:', data.likeCount);
            break;
          }
        }
      }

      // 2. JSON 데이터에서 좋아요수 찾기 (백업) - 패턴 강화
      if (!data.likeCount) {
        const likePatterns = [
          // 최신 YouTube 구조 (2024년 기준)
          /"likeButtonViewModel":{"likeButtonViewModel":{"toggleButtonViewModel":{"toggleButtonViewModel":{"defaultButtonViewModel":{"buttonViewModel":{"title":"([^"]+)"/,
          /"likeButtonViewModel":{"toggleButtonViewModel":{"toggleButtonViewModel":{"defaultButtonViewModel":{"buttonViewModel":{"title":"([^"]+)"/,
          /"segmentedLikeDislikeButtonViewModel":{"likeButtonViewModel":{"likeButtonViewModel":{"toggleButtonViewModel":{"toggleButtonViewModel":{"defaultButtonViewModel":{"buttonViewModel":{"title":"([^"]+)"/,
          // 접근성 라벨 패턴들
          /"defaultText":{"accessibility":{"accessibilityData":{"label":"([^"]*좋아요[^"]*)"}}/,
          /"toggledText":{"accessibility":{"accessibilityData":{"label":"([^"]*좋아요[^"]*)"}}/,
          /"accessibilityData":{"label":"([^"]*\d+[^"]*좋아요[^"]*)"/,
          // 일반 텍스트 패턴들
          /"likeCountText":"([^"]+)"/,
          /"toggledText":"([^"]*좋아요[^"]*)"/,
          /"title":"([^"]*좋아요[^"]*)"/,
          // 버튼 텍스트 패턴
          /"buttonText":{"simpleText":"([^"]*\d+[^"]*)"}/,
          /"text":"([^"]*\d+[^"]*좋아요[^"]*)"/,
          // aria-label 패턴들 강화
          /aria-label="([^"]*\d+[^"]*좋아요[^"]*)"/gi,
          /aria-label="([^"]*좋아요[^"]*\d+[^"]*)"/gi,
        ];

        for (const pattern of likePatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            const likeData = this.extractLikeCount(match[1]);
            if (likeData.count > 0) {
              data.likeCount = likeData.count;
              if (likeData.text) data.likeText = likeData.text;
              console.log('✅ JSON 패턴 좋아요:', data.likeText || data.likeCount);
              break;
            }
          }
        }
      }

      // 3. aria-label에서 정확한 숫자 추출 (최종 백업)
      if (!data.likeCount) {
        const ariaPatterns = [
          // 정확한 숫자가 포함된 aria-label
          /aria-label="[^"]*정확히\s*([\d,]+)\s*명/i,
          /aria-label="[^"]*([\d,]+)\s*명이\s*좋아요/i,
          /aria-label="[^"]*사용자\s*([\d,]+)\s*명[^"]*좋아/i,
          /aria-label="[^"]*([\d,]+)\s*명[^"]*좋아/i,
          /aria-label="[^"]*([\d,]+)\s*(?:others?|people)?[^"]*like/i,
        ];

        for (const pattern of ariaPatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            const num = parseInt(match[1].replace(/,/g, ''));
            if (num > 0 && num < 100000000) {
              data.likeCount = num;
              console.log('✅ aria-label 좋아요:', data.likeCount);
              break;
            }
          }
        }
      }
    }
  },

  /**
   * 좋아요 텍스트에서 숫자 추출 (개선된 버전)
   */
  extractLikeCount(text: string): { count: number; text?: string } {
    if (!text) return { count: 0 };

    console.log('🔍 좋아요 텍스트 분석:', text);

    // 1. 한국어 축약 패턴 (3천, 1.5만, 2.3만)
    const koreanPatterns = [
      /([\d.]+)천/,
      /([\d.]+)만/,
      /([\d.]+)억/,
      /(\d+\.?\d*)\s*천/,
      /(\d+\.?\d*)\s*만/,
      /(\d+\.?\d*)\s*억/,
    ];

    for (const pattern of koreanPatterns) {
      const koreanMatch = text.match(pattern);
      if (koreanMatch?.[1]) {
        const result = {
          count: parseAbbreviatedNumber(koreanMatch[1] + koreanMatch[0].slice(-1)),
          text: koreanMatch[0],
        };
        console.log('✅ 한국어 축약 매치:', koreanMatch[0], '→', result.count);
        return result;
      }
    }

    // 2. 영어 축약 패턴 (3K, 1.5M, 2.1B)
    const englishPatterns = [
      /([\d.]+)\s*K/i,
      /([\d.]+)\s*M/i,
      /([\d.]+)\s*B/i,
      /(\d+\.?\d*)\s*[Kk]/,
      /(\d+\.?\d*)\s*[Mm]/,
      /(\d+\.?\d*)\s*[Bb]/,
    ];

    for (const pattern of englishPatterns) {
      const englishMatch = text.match(pattern);
      if (englishMatch?.[1]) {
        const fullMatch = englishMatch[0].replace(/\s/g, '');
        const result = {
          count: parseAbbreviatedNumber(fullMatch),
          text: fullMatch,
        };
        console.log('✅ 영어 축약 매치:', fullMatch, '→', result.count);
        return result;
      }
    }

    // 3. 쉼표가 포함된 일반 숫자 (1,234, 12,345)
    const commaNumMatch = text.match(/([\d,]+)/);
    if (commaNumMatch?.[1] && commaNumMatch[1].includes(',')) {
      const num = parseInt(commaNumMatch[1].replace(/,/g, ''));
      if (num > 0) {
        console.log('✅ 쉼표 숫자 매치:', commaNumMatch[1], '→', num);
        return { count: num };
      }
    }

    // 4. 긴 일반 숫자 (1234, 12345 - 4자리 이상)
    const longNumMatch = text.match(/(\d{4,})/);
    if (longNumMatch?.[1]) {
      const num = parseInt(longNumMatch[1]);
      console.log('✅ 긴 숫자 매치:', longNumMatch[1], '→', num);
      return { count: num };
    }

    // 5. 공백이 포함된 숫자 (1 234, 12 345)
    const spaceNumMatch = text.match(/(\d+(?:\s+\d+)+)/);
    if (spaceNumMatch?.[1]) {
      const num = parseInt(spaceNumMatch[1].replace(/\s/g, ''));
      if (num > 1000) {
        console.log('✅ 공백 숫자 매치:', spaceNumMatch[1], '→', num);
        return { count: num };
      }
    }

    // 6. 작은 숫자도 허용 (100 이상)
    const anyNumMatch = text.match(/(\d+)/);
    if (anyNumMatch?.[1]) {
      const num = parseInt(anyNumMatch[1]);
      if (num >= 100) {
        console.log('✅ 일반 숫자 매치:', anyNumMatch[1], '→', num);
        return { count: num };
      }
    }

    console.log('❌ 좋아요 수 추출 실패:', text);
    return { count: 0 };
  },

  /**
   * 초를 MM:SS 또는 HH:MM:SS 형식으로 변환
   */
  formatSecondsToTime(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '0:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * HTML에서 직접 업로드 날짜 추출 (JSON-LD 실패 시 백업)
   */
  extractUploadDateFromHtml(html: string, data: ScrapedVideoDto): void {
    console.log('🔍 HTML에서 uploadDate 직접 추출 시도');

    // 다양한 업로드 날짜 패턴 시도
    const datePatterns = [
      /"uploadDate":"([^"]+)"/,
      /"datePublished":"([^"]+)"/,
      /publishDate['"]:['"]([^'"]+)['"]/,
      /upload.*date['"]:['"]([^'"]+)['"]/i,
      /"publishedTimeText":\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/,
    ];

    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        try {
          const dateStr = match[1];
          console.log('🔍 날짜 문자열 발견:', dateStr);

          // ISO 날짜 형식인 경우
          if (dateStr.includes('T') || dateStr.includes('-')) {
            data.uploadDate = new Date(dateStr).toISOString();
            console.log('✅ HTML에서 업로드일 추출:', dateStr, '→', data.uploadDate);
            return;
          }
        } catch (error) {
          console.log('❌ 날짜 파싱 실패:', error);
        }
      }
    }

    console.log('❌ HTML에서도 uploadDate를 찾을 수 없습니다');
  },

  /**
   * 강화된 메타데이터 추출 (최신 YouTube 구조 대응)
   */
  extractEnhancedMetadata(html: string, data: ScrapedVideoDto): void {
    console.log('🔍 강화된 메타데이터 추출 시작');

    // 다양한 ytInitialData 패턴 시도
    const ytDataPatterns = [
      /var\s+ytInitialData\s*=\s*({[\s\S]*?});/,
      /ytInitialData\s*=\s*({[\s\S]*?});/,
      /window\["ytInitialData"\]\s*=\s*({[\s\S]*?});/,
      /"ytInitialData":\s*({[\s\S]*?}),/,
      /ytInitialData"?\s*:\s*({[\s\S]*?})[,}]/,
    ];

    let ytDataMatch = null;
    for (const pattern of ytDataPatterns) {
      ytDataMatch = html.match(pattern);
      if (ytDataMatch) {
        console.log('🎯 ytInitialData 패턴 매치:', pattern.source.substring(0, 30) + '...');
        break;
      }
    }

    if (ytDataMatch) {
      try {
        const ytData = JSON.parse(ytDataMatch[1]!);
        console.log('🎯 강화된 ytInitialData 파싱 성공');
        this.extractFromYtData(ytData, data);
      } catch (error) {
        console.log('❌ 강화된 ytInitialData 파싱 실패:', error);
      }
    }

    // 정규표현식으로 직접 좋아요수 찾기 (패턴 강화)
    if (!data.likeCount) {
      const enhancedLikePatterns = [
        // 최신 YouTube 구조 패턴들 (2024년 기준)
        /"likeButtonViewModel":\s*{\s*"likeButtonViewModel":\s*{\s*"toggleButtonViewModel":\s*{\s*"toggleButtonViewModel":\s*{\s*"defaultButtonViewModel":\s*{\s*"buttonViewModel":\s*{\s*"title":\s*"([^"]+)"/gi,
        /"segmentedLikeDislikeButtonViewModel":\s*{\s*"likeButtonViewModel"[\s\S]*?"title":\s*"([^"]+)"/gi,
        // 접근성 라벨 패턴들
        /"toggledText":\s*{\s*"accessibility":\s*{\s*"accessibilityData":\s*{\s*"label":\s*"([^"]*좋아요[^"]*)"/gi,
        /"defaultText":\s*{\s*"accessibility":\s*{\s*"accessibilityData":\s*{\s*"label":\s*"([^"]*좋아요[^"]*)"/gi,
        /"accessibilityData":\s*{\s*"label":\s*"([^"]*\d+[^"]*좋아요[^"]*)"/gi,
        // 일반 title/label 패턴들
        /"title":\s*"([^"]*좋아요[^"]*)"/gi,
        /"ariaLabel":\s*"([^"]*좋아요[^"]*)"/gi,
        /"label":\s*"([^"]*\d+[^"]*좋아요[^"]*)"/gi,
        // 버튼 텍스트 패턴들
        /"buttonText":\s*{\s*"simpleText":\s*"([^"]*\d+[^"]*)"/gi,
        /"simpleText":\s*"([^"]*\d+[^"]*좋아요[^"]*)"/gi,
        // 영어 패턴들
        /"label":\s*"([^"]*\d+[^"]*like[^"]*)"/gi,
        /"title":\s*"([^"]*\d+[^"]*like[^"]*)"/gi,
        /"accessibilityData":\s*{\s*"label":\s*"([^"]*\d+[^"]*like[^"]*)"/gi,
      ];

      for (const pattern of enhancedLikePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          if (match[1]) {
            const likeData = this.extractLikeCount(match[1]);
            if (likeData.count > 0) {
              data.likeCount = likeData.count;
              if (likeData.text) data.likeText = likeData.text;
              console.log('✅ 강화된 패턴 좋아요:', data.likeText || data.likeCount);
              break;
            }
          }
        }
        if (data.likeCount > 0) break;
      }
    }

    // 조회수 패턴 강화
    if (!data.viewCount) {
      const enhancedViewPatterns = [
        /"viewCountText":\s*{\s*"simpleText":\s*"([^"]+)"/gi,
        /"shortViewCountText":\s*{\s*"simpleText":\s*"([^"]+)"/gi,
        /"viewCount":\s*{\s*"simpleText":\s*"([^"]+)"/gi,
        /"views":\s*"([^"]+)"/gi,
        /조회수\s*([\d,]+)/gi,
        /views?\s*([\d,]+)/gi,
      ];

      for (const pattern of enhancedViewPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          const viewText = match[1];
          const viewNum = this.parseViewCount(viewText);
          if (viewNum > 0) {
            data.viewCount = viewNum;
            console.log('✅ 강화된 조회수:', data.viewCount);
            break;
          }
        }
      }
    }
  },

  /**
   * ytData에서 데이터 추출 (공통 로직)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractFromYtData(ytData: any, data: ScrapedVideoDto): void {
    try {
      // videoPrimaryInfoRenderer에서 정보 추출
      const videoDetails =
        ytData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]
          ?.videoPrimaryInfoRenderer;

      if (videoDetails) {
        console.log('📋 videoPrimaryInfoRenderer 발견');

        // videoActions에서 좋아요 버튼 찾기
        const videoActions = videoDetails.videoActions?.menuRenderer?.topLevelButtons;
        if (videoActions && Array.isArray(videoActions)) {
          console.log('📋 topLevelButtons 개수:', videoActions.length);

          for (const button of videoActions) {
            // 새로운 segmentedLikeDislikeButtonViewModel 구조
            if (button.segmentedLikeDislikeButtonViewModel) {
              const likeViewModel =
                button.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel?.likeButtonViewModel
                  ?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel
                  ?.buttonViewModel;

              if (likeViewModel?.title) {
                const likeData = this.extractLikeCount(likeViewModel.title);
                if (likeData.count > 0) {
                  data.likeCount = likeData.count;
                  if (likeData.text) data.likeText = likeData.text;
                  console.log('✅ segmentedLikeDislike 좋아요:', data.likeText || data.likeCount);
                  break;
                }
              }
            }

            // 기존 toggleButtonRenderer 구조
            if (button.toggleButtonRenderer) {
              const toggleText =
                button.toggleButtonRenderer?.defaultText?.accessibility?.accessibilityData?.label ||
                button.toggleButtonRenderer?.toggledText?.accessibility?.accessibilityData?.label;

              if (toggleText) {
                const likeData = this.extractLikeCount(toggleText);
                if (likeData.count > 0) {
                  data.likeCount = likeData.count;
                  if (likeData.text) data.likeText = likeData.text;
                  console.log('✅ toggleButton 좋아요:', data.likeText || data.likeCount);
                  break;
                }
              }
            }
          }
        }

        // 조회수 정보
        const viewCountText =
          videoDetails.viewCount?.videoViewCountRenderer?.viewCount?.simpleText ||
          videoDetails.viewCount?.videoViewCountRenderer?.shortViewCount?.simpleText;

        if (viewCountText && !data.viewCount) {
          const viewNum = this.parseViewCount(viewCountText);
          if (viewNum > 0) {
            data.viewCount = viewNum;
            console.log('✅ videoPrimaryInfo 조회수:', data.viewCount);
          }
        }
      }
    } catch (error) {
      console.log('❌ ytData 추출 실패:', error);
    }
  },

  /**
   * 조회수 텍스트 파싱
   */
  parseViewCount(text: string): number {
    if (!text) return 0;

    // "1,234,567회 시청" -> 1234567
    const koreanMatch = text.match(/([\d,]+)(?:회|번|명)/);
    if (koreanMatch) {
      return parseInt(koreanMatch[1]!.replace(/,/g, ''));
    }

    // "1.2M views" -> 1200000
    const englishMatch = text.match(/([\d.]+)([KMB])\s*views?/i);
    if (englishMatch) {
      return parseAbbreviatedNumber(englishMatch[1]! + englishMatch[2]!);
    }

    // "1,234,567 views" -> 1234567
    const numberMatch = text.match(/([\d,]+)/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]!.replace(/,/g, ''));
      if (num > 100) return num;
    }

    return 0;
  },

  /**
   * HTML에서 VideoObject JSON 데이터 직접 추출
   */
  extractVideoObjectDirectly(html: string, data: ScrapedVideoDto): void {
    console.log('🔍 VideoObject 직접 추출 시도');

    // VideoObject JSON 패턴 찾기 (스크립트 태그 없이)
    const videoObjectMatch = html.match(
      /{"@context":"https:\/\/schema\.org","@type":"VideoObject"[\s\S]*?"author":"[^"]+"\}/,
    );

    if (!videoObjectMatch) {
      console.log('❌ VideoObject JSON을 찾을 수 없습니다');
      return;
    }

    try {
      const jsonLd = JSON.parse(videoObjectMatch[0]);
      console.log('🎯 VideoObject 직접 추출 성공!');

      // 정확한 조회수 추출 (WatchAction)
      if (jsonLd.interactionStatistic) {
        const viewStat = jsonLd.interactionStatistic.find(
          (stat: InteractionStatistic) => stat.interactionType === 'https://schema.org/WatchAction',
        );
        if (viewStat?.userInteractionCount) {
          data.viewCount = parseInt(viewStat.userInteractionCount.toString());
          console.log('✅ 정확한 조회수:', data.viewCount);
        }

        // 정확한 좋아요수 추출 (LikeAction)
        const likeStat = jsonLd.interactionStatistic.find(
          (stat: InteractionStatistic) => stat.interactionType === 'https://schema.org/LikeAction',
        );
        if (likeStat?.userInteractionCount) {
          data.likeCount = parseInt(likeStat.userInteractionCount.toString());
          console.log('✅ 정확한 좋아요수:', data.likeCount);
        }
      }

      // 업로드 날짜
      if (jsonLd.uploadDate) {
        data.uploadDate = new Date(jsonLd.uploadDate).toISOString();
        console.log('✅ 업로드일:', jsonLd.uploadDate.split('T')[0]);
      }

      // 영상 길이
      if (jsonLd.duration) {
        data.duration = formatYouTubeDuration(jsonLd.duration);
        console.log('✅ 영상 길이:', data.duration);
      }

      // 설명
      if (jsonLd.description) {
        data.description = jsonLd.description;
      }

      // 채널명
      if (jsonLd.author) {
        data.channelName = typeof jsonLd.author === 'string' ? jsonLd.author : jsonLd.author.name;
      }
    } catch (error) {
      console.log('❌ VideoObject 직접 파싱 실패:', error);
    }
  },
};
