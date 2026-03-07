/**
 * YouTube oEmbed API 스크래퍼
 */

import { OEmbedDto, YouTubeApiError, YouTubeErrorCode } from '../../types';
import { ScraperLogger } from '@/core/utils';

/**
 * oEmbed API를 통해 YouTube 비디오 기본 정보 가져오기
 */
export const oembedScraper = {
  /**
   * oEmbed 데이터 가져오기
   * @param videoId YouTube 비디오 ID
   * @returns oEmbed 응답 데이터
   */
  async fetchOEmbedData(videoId: string): Promise<OEmbedDto> {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new YouTubeApiError(
            `비디오를 찾을 수 없습니다: ${videoId}`,
            YouTubeErrorCode.VIDEO_NOT_FOUND,
          );
        }
        throw new YouTubeApiError(
          `oEmbed API 호출 실패: ${response.status}`,
          YouTubeErrorCode.API_ERROR,
          true, // 재시도 가능
        );
      }

      const data = await response.json();
      ScraperLogger.log('✅ oEmbed 데이터 수신:', {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url,
      });

      return data;
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }

      ScraperLogger.error('❌ oEmbed API 에러:', error);
      throw new YouTubeApiError('oEmbed API 네트워크 오류', YouTubeErrorCode.NETWORK_ERROR, true);
    }
  },

  /**
   * oEmbed 데이터에서 썸네일 URL 추출 및 변환
   * @param oembedData oEmbed 응답 데이터
   * @returns 다양한 품질의 썸네일 URL
   */
  extractThumbnails(oembedData: OEmbedDto) {
    const thumbnailUrl = oembedData.thumbnail_url;
    if (!thumbnailUrl) return {};

    // YouTube 썸네일 URL 패턴: https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
    const baseUrl = thumbnailUrl.replace(/\/[^/]+\.jpg$/, '');

    return {
      default: `${baseUrl}/default.jpg`, // 120x90
      medium: `${baseUrl}/mqdefault.jpg`, // 320x180
      high: `${baseUrl}/hqdefault.jpg`, // 480x360 (기본)
      standard: `${baseUrl}/sddefault.jpg`, // 640x480
      maxres: `${baseUrl}/maxresdefault.jpg`, // 1280x720
    };
  },
};
