import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import { ContentDto, ContentWithVideoDto, VideoWithContentDto, CurationVideoModel } from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import { ContentType } from '@/core/types/content/contentType.enum';
import { getUserWatchedContentIds } from './contentApiUtils';

export const contentChannelApi = {
  /**
   * RPC 함수를 사용하여 content_id 기준 중복 제거 및 페이징 처리
   * 우선순위: is_primary > includes_ending > runtime
   * @param channelId YouTube 채널 ID
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수
   */
  getDistinctContentsByChannel: async (
    channelId: string,
    page: number = 0,
    pageSize: number = 20,
    sortType: 'all' | 'latest' | 'popular' = 'latest',
  ): Promise<{ videos: VideoWithContentDto[]; hasMore: boolean; totalCount: number }> => {
    // 'all'은 랜덤 정렬로 처리
    const effectiveSortType = sortType === 'all' ? 'random' : sortType;

    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_DISTINCT_CONTENTS_BY_CHANNEL,
      {
        p_channel_id: channelId,
        p_page: page,
        p_page_size: pageSize,
        p_sort_type: effectiveSortType,
      },
    );

    if (error) {
      ContentLogger.error('채널 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch channel contents: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { videos: [], hasMore: false, totalCount: 0 };
    }

    // RPC 결과를 VideoWithContentDto로 변환
    const totalCount = Number(data[0]?.total_count ?? 0);
    const videos: VideoWithContentDto[] = data.map(
      (item: {
        id: string;
        content_id: number;
        content_type: string;
        title: string;
        runtime: number | null;
        thumbnail_url: string | null;
        is_primary: boolean;
        channel_id: string;
        includes_ending: boolean;
        uploaded_at: string;
        updated_at: string;
        content_title: string;
        content_poster_path: string;
      }) => ({
        id: item.id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        title: item.title,
        runtime: item.runtime ?? undefined,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        isPrimary: item.is_primary,
        channelId: item.channel_id,
        includesEnding: item.includes_ending,
        uploadedAt: item.uploaded_at,
        updatedAt: item.updated_at,
        contentTitle: item.content_title,
        contentPosterPath: item.content_poster_path,
      }),
    );

    const hasMore = (page + 1) * pageSize < totalCount;

    return { videos, hasMore, totalCount };
  },

  /**
   * 장르 기반 콘텐츠 조회
   * 특정 장르에 해당하고 includes_ending = true인 영상이 있는 콘텐츠만 반환
   * @param genreIds 장르 ID 배열
   * @param contentType 콘텐츠 타입 (movie | tv)
   * @param excludeIds 제외할 콘텐츠 ID 배열
   * @param limit 최대 조회 수 (기본값: 18)
   * @returns ContentDto 배열
   */
  getContentsByGenre: async (
    genreIds: number[],
    contentType: ContentType,
    excludeIds: number[],
    limit: number = 18,
  ): Promise<ContentDto[]> => {
    if (genreIds.length === 0) return [];

    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CONTENTS_BY_GENRE, {
      p_genre_ids: genreIds,
      p_content_type: contentType,
      p_exclude_ids: excludeIds,
      p_limit: limit,
    });

    if (error) {
      ContentLogger.error('장르 기반 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch contents by genre: ${error.message}`);
    }

    return mapWithField<ContentDto[]>(data ?? []);
  },

  /**
   * 러닝타임이 긴 콘텐츠 조회
   * isPrimary 비디오 중 런타임이 긴 12개를 engagement ratio 기반으로 정렬
   */
  getLongRuntimeContents: async (): Promise<ContentWithVideoDto[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_LONG_RUNTIME_CONTENTS,
    );

    if (error) {
      ContentLogger.error('러닝타임 긴 콘텐츠 조회 실패:', error);
      throw new Error(`Failed to fetch long runtime contents: ${error.message}`);
    }

    return mapWithField<ContentWithVideoDto[]>(data ?? []);
  },

  /**
   * 큐레이션 캐러셀용 랜덤 대표 비디오 조회
   * 콘텐츠별 대표 비디오 1개를 랜덤하게 선정하여 반환
   * @param limit 조회할 비디오 수 (기본값: 10)
   */
  getCurationVideos: async (limit: number = 10): Promise<CurationVideoModel[]> => {
    const { data, error } = await supabaseClient.rpc(
      CONTENT_DATABASE.RPC.GET_RANDOM_CURATION_VIDEOS,
      { p_limit: limit },
    );

    if (error) {
      ContentLogger.error('큐레이션 비디오 조회 실패:', error);
      throw new Error(`Failed to fetch curation videos: ${error.message}`);
    }

    // RPC 결과 타입 정의
    type RpcCurationVideo = {
      video_id: string;
      content_id: number;
      content_type: string;
      video_title: string;
      content_title: string;
      thumbnail_url: string | null;
      runtime: number | null;
      channel_id: string | null;
      channel_name: string | null;
      channel_logo_url: string | null;
      poster_path: string | null;
      backdrop_path: string | null;
      release_date: string | null;
      genre_ids: number[] | null;
    };

    // backdrop_path가 null인 항목 필터링 후 CurationVideoModel로 변환
    return (data ?? [])
      .filter((item: RpcCurationVideo) => item.backdrop_path != null)
      .map((item: RpcCurationVideo) => ({
        videoId: item.video_id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        videoTitle: item.video_title,
        contentTitle: item.content_title,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        runtime: item.runtime ?? undefined,
        channelId: item.channel_id ?? undefined,
        channelName: item.channel_name ?? undefined,
        channelLogoUrl: item.channel_logo_url ?? undefined,
        posterPath: item.poster_path ?? undefined,
        backdropPath: item.backdrop_path as string,
        releaseDate: item.release_date ?? undefined,
        genreIds: item.genre_ids ?? undefined,
      }));
  },

  /**
   * 채널 페이지용 비디오 조회
   * 채널별 비디오 목록을 콘텐츠/채널 정보와 함께 반환
   * @param channelIds 조회할 채널 ID 배열 (null이면 전체)
   * @param sortType 정렬 타입 (latest: 최신순, popular: 인기순, random: 랜덤)
   * @param page 페이지 번호 (0부터 시작)
   * @param pageSize 페이지당 항목 수
   * @param seed 랜덤 정렬용 시드 값
   * @param includeEnding 결말 포함 비디오만 필터링 여부
   * @param excludeWatched 시청한 콘텐츠 제외 여부
   * @param contentType 콘텐츠 타입 필터 (movie/tv)
   * @param genreIds 장르 ID 배열 필터
   * @param countryCodes 국가 코드 배열 필터
   * @param releaseYearRange 공개연도 범위 필터
   * @param minStarRating 최소 평점 필터 (1~5 스케일)
   */
  getChannelVideos: async (
    channelIds: string[] | null = null,
    sortType: 'latest' | 'popular' | 'random' = 'latest',
    page: number = 0,
    pageSize: number = 20,
    seed?: number,
    includeEnding: boolean = false,
    excludeWatched: boolean = false,
    contentType: ContentType | null = null,
    genreIds: number[] = [],
    countryCodes: string[] = [],
    releaseYearRange: { min: number; max: number } | null = null,
    minStarRating: number | null = null,
  ): Promise<{
    videos: Array<{
      videoId: string;
      contentId: number;
      contentType: ContentType;
      videoTitle: string;
      thumbnailUrl?: string;
      runtime?: number;
      channelId: string;
      channelName: string;
      channelLogoUrl: string;
      contentTitle: string;
      releaseDate?: string;
      genreIds?: number[];
      backdropPath?: string;
    }>;
    hasMore: boolean;
    totalCount: number;
  }> => {
    // excludeWatched 필터: 시청 기록이 있는 콘텐츠 ID 조회 (제외용)
    const excludeContentIds = excludeWatched ? await getUserWatchedContentIds() : null;

    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CHANNEL_VIDEOS, {
      p_channel_ids: channelIds,
      p_sort_type: sortType,
      p_page: page,
      p_page_size: pageSize,
      p_seed: seed,
      p_include_ending: includeEnding,
      p_exclude_content_ids: excludeContentIds,
      // 추가 필터 파라미터
      p_content_type: contentType,
      p_genre_ids: genreIds.length > 0 ? genreIds : null,
      p_origin_countries: countryCodes.length > 0 ? countryCodes : null,
      p_min_year: releaseYearRange?.min ?? null,
      p_max_year: releaseYearRange?.max ?? null,
      p_min_rating: minStarRating !== null ? minStarRating * 2 : null,
    });

    if (error) {
      ContentLogger.error('채널 비디오 조회 실패:', error);
      throw new Error(`Failed to fetch channel videos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { videos: [], hasMore: false, totalCount: 0 };
    }

    const totalCount = Number(data[0]?.total_count ?? 0);
    const videos = data.map(
      (item: {
        video_id: string;
        content_id: number;
        content_type: string;
        video_title: string;
        thumbnail_url: string | null;
        runtime: number | null;
        channel_id: string;
        channel_name: string;
        channel_logo_url: string;
        content_title: string;
        release_date: string | null;
        genre_ids: number[] | null;
        backdrop_path: string | null;
      }) => ({
        videoId: item.video_id,
        contentId: item.content_id,
        contentType: item.content_type as ContentType,
        videoTitle: item.video_title,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        runtime: item.runtime ?? undefined,
        channelId: item.channel_id,
        channelName: item.channel_name,
        channelLogoUrl: item.channel_logo_url,
        contentTitle: item.content_title,
        releaseDate: item.release_date ?? undefined,
        genreIds: item.genre_ids ?? undefined,
        backdropPath: item.backdrop_path ?? undefined,
      }),
    );

    const hasMore = (page + 1) * pageSize < totalCount;

    return { videos, hasMore, totalCount };
  },
};
