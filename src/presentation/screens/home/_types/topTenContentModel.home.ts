import { TrendingItemDto } from '@/features/tmdb/types/common';
import { ContentDto } from '@/features/content/types';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';

/**
 * 실시간 Top 10 콘텐츠 아이템 모델
 */
export interface TopTenContentModel extends BaseContentModel {
  readonly rank: number;
  readonly backdropPath: string | undefined;
  readonly source: 'tmdb' | 'engagement';
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TopTenContentModel {
  /**
   * TMDB TrendingItemDto를 TopTenContentModel로 변환
   * @param item TMDB 트렌딩 아이템
   * @param rank 순위
   */
  export function fromTrendingItem(item: TrendingItemDto, rank: number): TopTenContentModel {
    return {
      rank,
      id: item.id,
      title: item.title ?? item.name ?? '제목 없음',
      type: item.mediaType === 'movie' ? 'movie' : 'tv',
      posterPath: item.posterPath ?? '',
      backdropPath: item.backdropPath ?? undefined,
      source: 'tmdb',
    };
  }

  /**
   * Supabase ContentDto를 TopTenContentModel로 변환
   * @param content Supabase 콘텐츠 DTO
   * @param rank 순위
   */
  export function fromContentDto(content: ContentDto, rank: number): TopTenContentModel {
    return {
      rank,
      id: content.id,
      title: content.title,
      type: content.contentType,
      posterPath: content.posterPath ?? '',
      backdropPath: content.backdropPath,
      source: 'engagement',
    };
  }
}
