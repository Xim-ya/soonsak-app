import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TmdbImageItemDto } from '../types/imageDto';
import { ContentType } from '@/core/types/content/contentType.enum';
import { tmdbApi } from '../api/tmdbApi';
import { tmdbKeys } from './tmdbQueryKeys';

interface UseContentImagesResult {
  readonly data: TmdbImageItemDto[];
  readonly isLoading: boolean;
  readonly error: Error | null;
}

/**
 * useContentImages - 콘텐츠 배경 이미지(스틸컷) 목록을 조회하는 훅
 *
 * TMDB Images API를 호출하여 backdrops 이미지를 조회합니다.
 * React Query 캐싱으로 여러 화면에서 호출해도 API는 1회만 요청됩니다.
 *
 * @param contentId - 콘텐츠 고유 ID
 * @param contentType - 콘텐츠 타입 ('movie' | 'tv')
 * @param excludeFilePath - 제외할 이미지 filePath (헤더 배경 이미지 제외용)
 */
export function useContentImages(
  contentId: number,
  contentType: ContentType,
  excludeFilePath?: string,
): UseContentImagesResult {
  const { data, isLoading, error } = useQuery({
    queryKey: tmdbKeys.images(contentId, contentType),
    queryFn: async (): Promise<TmdbImageItemDto[]> => {
      const response = await tmdbApi.getContentImages(contentId, contentType as 'movie' | 'tv');

      return response.data.backdrops.slice().sort((a, b) => b.voteAverage - a.voteAverage);
    },
    enabled: (contentType === 'movie' || contentType === 'tv') && !!contentId,
    retry: false,
  });

  const filtered = useMemo(() => {
    const images = data || [];
    if (!excludeFilePath) return images;
    return images.filter((img) => img.filePath !== excludeFilePath);
  }, [data, excludeFilePath]);

  return {
    data: filtered,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
