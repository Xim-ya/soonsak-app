/**
 * TMDB 콘텐츠 상세 정보 조회 Hook
 * Movie와 TV Series 모두 지원
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { TmdbApiError } from '../types/common';
import { MovieDto } from '../types/movieDto';
import { TvSeriesDto } from '../types/tvDto';
import { tmdbApi } from '../api/tmdbApi';
import { ContentType } from '@/core/types/content/contentType.enum';
import { Logger } from '@/core/utils';
import { tmdbKeys } from './tmdbQueryKeys';

const TMDBLogger = Logger.create('TMDB');

/**
 * 콘텐츠 상세 정보 조회 Hook
 * @param contentId 콘텐츠 ID (영화 ID 또는 TV 시리즈 ID) - 필수, number 타입
 * @param contentType 콘텐츠 타입 ('movie' | 'tv' | 'unknown') - 필수
 * @param options React Query 옵션
 */
export const useContentDetail = (
  contentId: number,
  contentType: ContentType,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  },
): UseQueryResult<MovieDto | TvSeriesDto, TmdbApiError> => {
  const id = contentId;

  return useQuery({
    queryKey: tmdbKeys.detail(id, contentType),
    queryFn: async () => {
      try {
        let response;

        if (contentType === 'movie') {
          response = await tmdbApi.getMovieDetails(id);
        } else if (contentType === 'tv') {
          response = await tmdbApi.getTvDetails(id);
        } else {
          throw new TmdbApiError(`지원하지 않는 콘텐츠 타입: ${contentType}`, 400, false);
        }

        return response.data;
      } catch (error) {
        // 에러 로깅
        TMDBLogger.error('콘텐츠 상세 정보 조회 실패:', {
          contentId: id,
          contentType,
          // eslint-disable-next-line indent
          error:
            error instanceof TmdbApiError
              ? { message: error.message, code: error.statusCode, status: error.statusCode }
              : error,
        });
        throw error; // React Query가 처리하도록 에러 재발생
      }
    },
    enabled: (contentType === 'movie' || contentType === 'tv') && (options?.enabled ?? true),
    retry: false,
  });
};
