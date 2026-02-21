import { MovieDto } from '../types/movieDto';
import { TvSeriesDto } from '../types/tvDto';
import { TVCreditsResponse, MovieCreditsResponse } from '../types/creditDto';
import { WatchProvidersResponseDto } from '../types/watchProviderDto';
import { TmdbImagesResponseDto } from '../types/imageDto';
import {
  TmdbPaginatedResponse,
  RelatedMovieItemDto,
  RelatedTvItemDto,
  TrendingItemDto,
  SearchMultiItemDto,
} from '../types/common';
import { tmdbClient } from '@/features/utils/clients/tmbClient';

export const tmdbApi = {
  /**
   * 영화 상세 정보 조회
   * @param movieId 영화 ID
   * @returns 영화 상세 정보 (한국어)
   */
  getMovieDetails: (movieId: number) => tmdbClient.get<MovieDto>(`/movie/${movieId}`),

  /**
   * TV 시리즈 상세 정보 조회
   * @param seriesId TV 시리즈 ID
   * @returns TV 시리즈 상세 정보 (한국어)
   */
  getTvDetails: (seriesId: number) => tmdbClient.get<TvSeriesDto>(`/tv/${seriesId}`),

  /**
   * TV 시리즈 크레딧 정보 조회
   * @param seriesId TV 시리즈 ID
   * @returns TV 시리즈 크레딧 정보 (한국어)
   */
  getTvCredits: (seriesId: number) => tmdbClient.get<TVCreditsResponse>(`/tv/${seriesId}/credits`),

  /**
   * 영화 크레딧 정보 조회
   * @param movieId 영화 ID
   * @returns 영화 크레딧 정보 (한국어)
   */
  getMovieCredits: (movieId: number) =>
    tmdbClient.get<MovieCreditsResponse>(`/movie/${movieId}/credits`),

  /**
   * 영화 추천 콘텐츠 조회
   * @param movieId 영화 ID
   * @returns 추천 영화 목록
   */
  getMovieRecommendations: (movieId: number) =>
    tmdbClient.get<TmdbPaginatedResponse<RelatedMovieItemDto>>(`/movie/${movieId}/recommendations`),

  /**
   * 유사 영화 조회
   * @param movieId 영화 ID
   * @returns 유사 영화 목록
   */
  getSimilarMovies: (movieId: number) =>
    tmdbClient.get<TmdbPaginatedResponse<RelatedMovieItemDto>>(`/movie/${movieId}/similar`),

  /**
   * TV 시리즈 추천 콘텐츠 조회
   * @param seriesId TV 시리즈 ID
   * @returns 추천 TV 시리즈 목록
   */
  getTvRecommendations: (seriesId: number) =>
    tmdbClient.get<TmdbPaginatedResponse<RelatedTvItemDto>>(`/tv/${seriesId}/recommendations`),

  /**
   * 유사 TV 시리즈 조회
   * @param seriesId TV 시리즈 ID
   * @returns 유사 TV 시리즈 목록
   */
  getSimilarTvSeries: (seriesId: number) =>
    tmdbClient.get<TmdbPaginatedResponse<RelatedTvItemDto>>(`/tv/${seriesId}/similar`),

  /**
   * TMDB 주간 트렌딩 콘텐츠 조회 (movie + tv 통합)
   * @returns 최근 1주일간 인기 콘텐츠 목록
   */
  getTrendingWeekly: () =>
    tmdbClient.get<TmdbPaginatedResponse<TrendingItemDto>>('/trending/all/week'),

  /**
   * 스트리밍 공급처 조회 (movie/tv 공통)
   * @param contentId 콘텐츠 ID
   * @param contentType 'movie' | 'tv'
   * @returns 국가별 스트리밍 공급처 정보
   */
  getWatchProviders: (contentId: number, contentType: 'movie' | 'tv') =>
    tmdbClient.get<WatchProvidersResponseDto>(`/${contentType}/${contentId}/watch/providers`),

  /**
   * 콘텐츠 이미지 목록 조회 (movie/tv 공통)
   * @param contentId 콘텐츠 ID
   * @param contentType 'movie' | 'tv'
   * @returns 배경, 포스터, 로고 이미지 목록
   */
  getContentImages: (contentId: number, contentType: 'movie' | 'tv') =>
    tmdbClient.get<TmdbImagesResponseDto>(`/${contentType}/${contentId}/images`, {
      params: { include_image_language: 'ko,en,null' },
    }),

  /**
   * TMDB 통합 검색 (영화 + TV)
   * @param query 검색어
   * @param page 페이지 번호 (기본값: 1)
   * @returns 검색 결과 (movie, tv 타입만 필터링하여 반환)
   */
  searchMulti: (query: string, page: number = 1) =>
    tmdbClient.get<TmdbPaginatedResponse<SearchMultiItemDto>>('/search/multi', {
      params: { query, page, include_adult: false },
    }),
};
