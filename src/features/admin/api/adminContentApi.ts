/**
 * Admin Content API
 *
 * 어드민 전용 콘텐츠 관련 API
 */

import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { CONTENT_DATABASE } from '@/features/utils/constants/dbConfig';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import type { MovieDto } from '@/features/tmdb/types/movieDto';
import type { TvSeriesDto } from '@/features/tmdb/types/tvDto';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { ContentStatus } from '@/features/content/types';

export const adminContentApi = {
  /**
   * 콘텐츠 backdrop_path 업데이트
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param backdropPath TMDB backdrop 경로 (예: /abc123.jpg)
   */
  updateBackdropPath: async (
    contentId: number,
    contentType: ContentType,
    backdropPath: string,
  ): Promise<void> => {
    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .update({ backdrop_path: backdropPath })
      .eq('id', contentId)
      .eq('content_type', contentType);

    if (error) {
      console.error('Backdrop 업데이트 실패:', error);
      throw new Error(`Failed to update backdrop path: ${error.message}`);
    }
  },

  /**
   * 비디오 상태 업데이트
   * rejected로 변경 시:
   * - is_primary = false 함께 설정 (앱에서 처리)
   * - DB 트리거가 자동으로: 유일한 비디오면 콘텐츠 삭제, 아니면 다음 비디오를 primary로 승격
   *
   * @param videoId 비디오 ID
   * @param status 새 상태
   */
  updateVideoStatus: async (videoId: string, status: ContentStatus): Promise<void> => {
    // rejected로 변경 시 is_primary도 false로 설정
    const updateData = status === 'rejected' ? { status, is_primary: false } : { status };

    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update(updateData)
      .eq('id', videoId);

    if (error) {
      console.error('비디오 상태 업데이트 실패:', error);
      throw new Error(`Failed to update video status: ${error.message}`);
    }
  },

  /**
   * 콘텐츠 상태 업데이트
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param status 새 상태
   */
  updateContentStatus: async (
    contentId: number,
    contentType: ContentType,
    status: ContentStatus,
  ): Promise<void> => {
    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .update({ status })
      .eq('id', contentId)
      .eq('content_type', contentType);

    if (error) {
      console.error('콘텐츠 상태 업데이트 실패:', error);
      throw new Error(`Failed to update content status: ${error.message}`);
    }
  },

  /**
   * 비디오를 다른 콘텐츠로 재매핑
   *
   * 잘못된 콘텐츠에 매핑된 비디오를 올바른 콘텐츠로 이동시킵니다.
   * - 새 콘텐츠가 DB에 없으면 TMDB에서 정보를 가져와서 생성
   * - 비디오의 content_id, content_type을 새 콘텐츠로 변경
   * - 비디오 status를 'confirmed'로 변경
   * - 기존 콘텐츠에 이 비디오만 있었다면 기존 콘텐츠 삭제
   *
   * @param videoId 비디오 ID
   * @param oldContentId 기존 콘텐츠 ID
   * @param oldContentType 기존 콘텐츠 타입
   * @param newContentId 새 콘텐츠 ID (TMDB ID)
   * @param newContentType 새 콘텐츠 타입
   * @returns 기존 콘텐츠 삭제 여부, 새 콘텐츠 생성 여부
   */
  remapVideoContent: async (
    videoId: string,
    oldContentId: number,
    oldContentType: ContentType,
    newContentId: number,
    newContentType: ContentType,
  ): Promise<{ oldContentDeleted: boolean; newContentCreated: boolean }> => {
    // 1. 새 콘텐츠가 DB에 있는지 확인
    const { data: existingContent, error: checkError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.CONTENTS)
      .select('id')
      .eq('id', newContentId)
      .eq('content_type', newContentType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (정상적인 "없음" 상태)
      console.error('콘텐츠 존재 여부 확인 실패:', checkError);
      throw new Error(`Failed to check content existence: ${checkError.message}`);
    }

    let newContentCreated = false;

    // 2. 새 콘텐츠가 없으면 TMDB에서 정보 가져와서 생성
    if (!existingContent) {
      try {
        let contentData: {
          id: number;
          content_type: ContentType;
          title: string;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string | null;
          genre_ids: number[];
          overview: string;
          vote_average: number;
          popularity: number;
          original_language: string;
          tagline: string | null;
          origin_country: string[];
          status: ContentStatus;
        };

        if (newContentType === 'movie') {
          const movieResponse = await tmdbApi.getMovieDetails(newContentId);
          const movie: MovieDto = movieResponse.data;
          contentData = {
            id: newContentId,
            content_type: newContentType,
            title: movie.title,
            poster_path: movie.posterPath,
            backdrop_path: movie.backdropPath,
            release_date: movie.releaseDate || null,
            genre_ids: movie.genres?.map((g) => g.id) ?? [],
            overview: movie.overview,
            vote_average: movie.voteAverage,
            popularity: movie.popularity,
            original_language: movie.originalLanguage,
            tagline: movie.tagline || null,
            origin_country: movie.originCountry ?? [],
            status: 'confirmed',
          };
        } else {
          const tvResponse = await tmdbApi.getTvDetails(newContentId);
          const tv: TvSeriesDto = tvResponse.data;
          contentData = {
            id: newContentId,
            content_type: newContentType,
            title: tv.name,
            poster_path: tv.posterPath,
            backdrop_path: tv.backdropPath,
            release_date: tv.firstAirDate || null,
            genre_ids: tv.genres?.map((g) => g.id) ?? [],
            overview: tv.overview,
            vote_average: tv.voteAverage,
            popularity: tv.popularity,
            original_language: tv.originalLanguage,
            tagline: tv.tagline || null,
            origin_country: tv.originCountry ?? [],
            status: 'confirmed',
          };
        }

        const { error: insertError } = await supabaseClient
          .from(CONTENT_DATABASE.TABLES.CONTENTS)
          .insert(contentData);

        if (insertError) {
          console.error('새 콘텐츠 생성 실패:', insertError);
          throw new Error(`Failed to create new content: ${insertError.message}`);
        }

        newContentCreated = true;
        console.log(`새 콘텐츠 생성됨: ${newContentType}/${newContentId}`);
      } catch (error) {
        console.error('TMDB 정보 조회 또는 콘텐츠 생성 실패:', error);
        throw error;
      }
    }

    // 3. 기존 콘텐츠에 매핑된 비디오 수 확인
    const { count: videoCount, error: countError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select('*', { count: 'exact', head: true })
      .eq('content_id', oldContentId)
      .eq('content_type', oldContentType);

    if (countError) {
      console.error('비디오 수 조회 실패:', countError);
      throw new Error(`Failed to count videos: ${countError.message}`);
    }

    const isOnlyVideo = videoCount === 1;

    // 4. 비디오를 새 콘텐츠로 재매핑 + status를 confirmed로 변경
    const { error: updateError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update({
        content_id: newContentId,
        content_type: newContentType,
        status: 'confirmed',
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('비디오 재매핑 실패:', updateError);
      throw new Error(`Failed to remap video: ${updateError.message}`);
    }

    // 5. 기존 콘텐츠에 이 비디오만 있었다면 기존 콘텐츠 삭제
    if (isOnlyVideo) {
      const { error: deleteError } = await supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        .delete()
        .eq('id', oldContentId)
        .eq('content_type', oldContentType);

      if (deleteError) {
        console.error('기존 콘텐츠 삭제 실패:', deleteError);
        // 비디오 재매핑은 성공했으므로 에러를 throw하지 않음
      }
    }

    return { oldContentDeleted: isOnlyVideo, newContentCreated };
  },

  /**
   * 콘텐츠에 매핑된 비디오 목록 조회
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @returns 비디오 목록 (썸네일, 제목, 채널명, is_primary 포함)
   */
  getContentVideos: async (
    contentId: number,
    contentType: ContentType,
  ): Promise<ContentVideoItem[]> => {
    const { data, error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select(
        `
        id,
        title,
        thumbnail_url,
        is_primary,
        status,
        channels (
          name
        )
      `,
      )
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('is_primary', { ascending: false })
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('비디오 목록 조회 실패:', error);
      throw new Error(`Failed to fetch content videos: ${error.message}`);
    }

    return (data ?? []).map((video) => {
      // channels는 foreign key 관계로 단일 객체 또는 null로 반환됨
      const channel = video.channels as unknown as { name: string } | null;
      return {
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url,
        isPrimary: video.is_primary ?? false,
        status: video.status,
        channelName: channel?.name ?? null,
      };
    });
  },

  /**
   * 콘텐츠의 비디오 개수 조회
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @returns 비디오 개수
   */
  getContentVideoCount: async (contentId: number, contentType: ContentType): Promise<number> => {
    const { count, error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (error) {
      console.error('비디오 개수 조회 실패:', error);
      throw new Error(`Failed to count videos: ${error.message}`);
    }

    return count ?? 0;
  },

  /**
   * 대표 비디오 변경
   *
   * 기존 대표 비디오의 is_primary를 false로 변경하고,
   * 새 비디오의 is_primary를 true로 변경합니다.
   *
   * @param contentId 콘텐츠 ID
   * @param contentType 콘텐츠 타입
   * @param newPrimaryVideoId 새 대표 비디오 ID
   */
  changePrimaryVideo: async (
    contentId: number,
    contentType: ContentType,
    newPrimaryVideoId: string,
  ): Promise<void> => {
    // 1. 기존 대표 비디오 해제 (해당 콘텐츠의 모든 비디오에서 is_primary = false)
    const { error: resetError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update({ is_primary: false })
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (resetError) {
      console.error('기존 대표 비디오 해제 실패:', resetError);
      throw new Error(`Failed to reset primary video: ${resetError.message}`);
    }

    // 2. 새 대표 비디오 설정
    const { error: updateError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update({ is_primary: true })
      .eq('id', newPrimaryVideoId);

    if (updateError) {
      console.error('새 대표 비디오 설정 실패:', updateError);
      throw new Error(`Failed to set primary video: ${updateError.message}`);
    }
  },

  /**
   * 비디오 결말포함 여부 업데이트
   * @param videoId 비디오 ID
   * @param includesEnding 결말포함 여부
   */
  updateIncludesEnding: async (videoId: string, includesEnding: boolean): Promise<void> => {
    const { error } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .update({ includes_ending: includesEnding })
      .eq('id', videoId);

    if (error) {
      console.error('결말포함 여부 업데이트 실패:', error);
      throw new Error(`Failed to update includes_ending: ${error.message}`);
    }
  },
};

/**
 * 콘텐츠 비디오 아이템 타입
 */
export interface ContentVideoItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  isPrimary: boolean;
  status: ContentStatus;
  channelName: string | null;
}
