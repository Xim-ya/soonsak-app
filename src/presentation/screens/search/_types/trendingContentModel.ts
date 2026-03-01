import { TrendingItemDto } from '@/features/tmdb/types/common';
import { ContentDto, LogoLanguage } from '@/features/content/types';
import { BaseContentModel } from '@/shared/types/content/baseContentModel';
import { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * 검색 화면 트렌딩 콘텐츠 아이템 모델
 */
export interface TrendingContentModel extends BaseContentModel {
  readonly rank: number;
  readonly source: 'tmdb' | 'engagement';
  /** 타이틀 로고 이미지 경로 */
  readonly titleLogo?: string;
  /** 타이틀 로고 언어 */
  readonly titleLogoLang?: LogoLanguage;
}

/** rank가 1 이상의 양수인지 확인하고, 아니면 1로 보정 */
function ensureValidRank(rank: number): number {
  return Math.max(1, Math.floor(rank));
}

/** 유효한 콘텐츠 타입 목록 */
const VALID_CONTENT_TYPES: ContentType[] = ['movie', 'tv', 'unknown'];

/**
 * contentType 문자열을 안전하게 ContentType으로 변환
 * 유효하지 않은 값은 'unknown'으로 처리
 */
function safeContentType(contentType: string | undefined | null): ContentType {
  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
    return 'unknown';
  }
  return contentType as ContentType;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TrendingContentModel {
  /**
   * TMDB TrendingItemDto와 매칭된 ContentDto를 TrendingContentModel로 변환
   * @param item TMDB 트렌딩 아이템
   * @param contentDto 매칭된 Supabase ContentDto (titleLogo 정보용)
   * @param rank 순위 (1 이상의 양수, 그 외의 값은 1로 보정됨)
   */
  export function fromTrendingItem(
    item: TrendingItemDto,
    contentDto: ContentDto | undefined,
    rank: number,
  ): TrendingContentModel {
    const validRank = ensureValidRank(rank);
    const contentType: ContentType = item.mediaType === 'movie' ? 'movie' : 'tv';
    const base: TrendingContentModel = {
      rank: validRank,
      id: item.id,
      title: item.title ?? item.name ?? '제목 없음',
      type: contentType,
      posterPath: item.posterPath ?? '',
      backdropPath: item.backdropPath ?? '',
      source: 'tmdb',
    };

    // titleLogo/titleLogoLang은 값이 있을 때만 추가 (exactOptionalPropertyTypes 대응)
    if (contentDto?.titleLogo && contentDto?.titleLogoLang) {
      return {
        ...base,
        titleLogo: contentDto.titleLogo,
        titleLogoLang: contentDto.titleLogoLang,
      };
    }

    return base;
  }

  /**
   * Supabase ContentDto를 TrendingContentModel로 변환
   * @param content Supabase 콘텐츠 DTO
   * @param rank 순위 (1 이상의 양수, 그 외의 값은 1로 보정됨)
   */
  export function fromContentDto(content: ContentDto, rank: number): TrendingContentModel {
    const validRank = ensureValidRank(rank);
    const base = {
      rank: validRank,
      id: content.id,
      title: content.title ?? '제목 없음',
      type: safeContentType(content.contentType),
      posterPath: content.posterPath ?? '',
      backdropPath: content.backdropPath ?? '',
      source: 'engagement' as const,
    };

    // titleLogo/titleLogoLang은 값이 있을 때만 추가 (exactOptionalPropertyTypes 대응)
    if (content.titleLogo && content.titleLogoLang) {
      return {
        ...base,
        titleLogo: content.titleLogo,
        titleLogoLang: content.titleLogoLang,
      };
    }

    return base;
  }
}
