/**
 * YouTube API 통합 인터페이스
 * oEmbed API와 페이지 스크래핑을 결합하여 완전한 비디오 메타데이터 제공
 */

import {
  YouTubeVideoDto,
  OEmbedDto,
  ScrapedVideoDto,
  YouTubeApiError,
  YouTubeErrorCode,
} from '../types';
import { extractVideoId, buildThumbnailUrl } from '../utils';
import { oembedScraper } from './scrapers/oembedScraper';
import { pageScraper } from './scrapers/pageScraper';
import { YouTubeLogger } from '@/shared/utils/logger';

/**
 * 백그라운드 작업 실행기 - UI 블로킹 방지
 * XIYA NOTE : 이건 feature/utils에 적절하게 위치시키기ㅣ
 */
const runInBackground = <T>(task: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    const executeTask = () => {
      requestAnimationFrame(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    };
    setTimeout(executeTask, 0);
  });
};

export const youtubeApi = {
  /**
   * YouTube 비디오 전체 메타데이터 조회
   * oEmbed + 페이지 스크래핑 데이터 결합
   */
  async getVideoMetadata(urlOrId: string): Promise<YouTubeVideoDto> {
    return runInBackground(async () => {
      const videoId = extractVideoId(urlOrId) || urlOrId;

      if (!videoId) {
        throw new YouTubeApiError('Invalid YouTube URL or video ID', YouTubeErrorCode.INVALID_URL);
      }

      YouTubeLogger.log('🎯 YouTube 메타데이터 수집 시작:', videoId);
      const startTime = Date.now();

      // 병렬로 데이터 수집
      const [oembedResult, scrapedResult] = await Promise.allSettled([
        oembedScraper.fetchOEmbedData(videoId),
        pageScraper.scrapeVideoPage(videoId),
      ]);

      const oembedData = oembedResult.status === 'fulfilled' ? oembedResult.value : null;
      const scrapedData =
        scrapedResult.status === 'fulfilled' ? scrapedResult.value : ({} as ScrapedVideoDto);

      const endTime = Date.now();
      YouTubeLogger.log(`⏱️ 데이터 수집 완료 (${endTime - startTime}ms)`);

      // oEmbed 성공 시: oEmbed + 스크래핑 데이터 병합
      if (oembedData) {
        return this.mergeVideoData(oembedData, scrapedData, videoId);
      }

      // oEmbed 실패 + 스크래핑 성공 시: 스크래핑 데이터만으로 구성
      // (임베드 제한 영상은 oEmbed가 401 반환하지만 페이지 스크래핑은 정상 동작)
      if (scrapedData.viewCount !== undefined) {
        YouTubeLogger.log('⚠️ oEmbed 실패 → 스크래핑 데이터로 대체');
        return this.buildFromScrapedData(scrapedData, videoId);
      }

      // 둘 다 실패
      if (oembedResult.status === 'rejected') {
        throw oembedResult.reason;
      }
      throw new YouTubeApiError('Failed to fetch basic video data', YouTubeErrorCode.API_ERROR);
    });
  },

  /**
   * 빠른 기본 정보만 조회 (oEmbed만 사용)
   */
  async getQuickVideoInfo(urlOrId: string): Promise<Partial<YouTubeVideoDto>> {
    const videoId = extractVideoId(urlOrId) || urlOrId;

    if (!videoId) {
      throw new YouTubeApiError('Invalid YouTube URL or video ID', YouTubeErrorCode.INVALID_URL);
    }

    const oembedData = await oembedScraper.fetchOEmbedData(videoId);
    const thumbnails = oembedScraper.extractThumbnails(oembedData);

    return {
      id: videoId,
      title: oembedData.title,
      channelName: oembedData.author_name,
      thumbnails: {
        default: thumbnails.default || '',
        ...(thumbnails.high && { high: thumbnails.high }),
        ...(thumbnails.maxres && { maxres: thumbnails.maxres }),
      },
      metrics: {
        viewCount: 0,
        likeCount: 0,
      },
      metadata: {
        duration: '0:00',
        uploadDate: new Date().toISOString(),
        embedHtml: oembedData.html,
      },
    };
  },

  /**
   * 비디오 메트릭스만 조회 (조회수, 좋아요 등)
   */
  async getVideoMetrics(urlOrId: string): Promise<YouTubeVideoDto['metrics']> {
    const videoId = extractVideoId(urlOrId) || urlOrId;

    if (!videoId) {
      throw new YouTubeApiError('Invalid YouTube URL or video ID', YouTubeErrorCode.INVALID_URL);
    }

    const scrapedData = await pageScraper.scrapeMetrics(videoId);

    return {
      viewCount: scrapedData.viewCount || 0,
      likeCount: scrapedData.likeCount || 0,
      ...(scrapedData.likeText && { likeText: scrapedData.likeText }),
    };
  },

  /**
   * 여러 비디오 일괄 조회 (배치 최적화)
   */
  async getMultipleVideos(
    urls: string[],
  ): Promise<(YouTubeVideoDto | { error: true; url: string; message: string })[]> {
    const promises = urls.map(async (url) => {
      try {
        return await this.getVideoMetadata(url);
      } catch (error) {
        return {
          error: true as const,
          url,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    return Promise.all(promises);
  },

  /**
   * 스크래핑 데이터만으로 비디오 객체 생성 (oEmbed 실패 시 fallback)
   */
  buildFromScrapedData(scrapedData: ScrapedVideoDto, videoId: string): YouTubeVideoDto {
    return {
      id: videoId,
      title: scrapedData.channelName || videoId,
      channelName: scrapedData.channelName || '',
      ...(scrapedData.description && { description: scrapedData.description }),
      thumbnails: {
        default: buildThumbnailUrl(videoId, 'default'),
        high: buildThumbnailUrl(videoId, 'high'),
        maxres: buildThumbnailUrl(videoId, 'maxres'),
      },
      metrics: {
        viewCount: scrapedData.viewCount,
        likeCount: scrapedData.likeCount,
        ...(scrapedData.likeText && { likeText: scrapedData.likeText }),
      },
      metadata: {
        duration: scrapedData.duration,
        uploadDate: scrapedData.uploadDate || new Date().toISOString(),
      },
    };
  },

  /**
   * oEmbed와 스크래핑 데이터를 병합하여 완전한 비디오 객체 생성
   */
  mergeVideoData(
    oembedData: OEmbedDto,
    scrapedData: ScrapedVideoDto,
    videoId: string,
  ): YouTubeVideoDto {
    const thumbnails = oembedScraper.extractThumbnails(oembedData);

    return {
      id: videoId,
      title: oembedData.title || 'Unknown Title',
      channelName: oembedData.author_name || scrapedData.channelName || 'Unknown Channel',
      ...(scrapedData.description && { description: scrapedData.description }),
      thumbnails: {
        default: thumbnails.default || '',
        ...(thumbnails.high && { high: thumbnails.high }),
        ...(thumbnails.maxres && { maxres: thumbnails.maxres }),
      },
      metrics: {
        viewCount: scrapedData.viewCount,
        likeCount: scrapedData.likeCount,
        ...(scrapedData.likeText && { likeText: scrapedData.likeText }),
      },
      metadata: {
        duration: scrapedData.duration,
        uploadDate: scrapedData.uploadDate || new Date().toISOString(), // 추출 실패 시 현재 날짜
        ...(oembedData.html && { embedHtml: oembedData.html }),
      },
    };
  },
};
