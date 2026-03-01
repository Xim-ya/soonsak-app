/**
 * Content Search Model
 *
 * 콘텐츠 검색에 사용되는 도메인 모델
 * ContentDto, VideoDto를 UI 친화적인 형태로 변환합니다.
 */

import type { ContentDto, VideoDto } from '@/features/content/types';

/** 콘텐츠 검색 모델 */
export interface ContentSearchModel {
  readonly id: number;
  readonly contentType: 'movie' | 'tv';
  readonly title: string;
  readonly posterPath: string | null;
  readonly releaseDate: string | null;
}

/** 비디오 검색 모델 */
export interface VideoSearchModel {
  readonly id: string;
  readonly contentId: number;
  readonly title: string;
  readonly runtime: number | null;
  readonly thumbnailUrl: string | null;
  readonly isPrimary: boolean;
  readonly includesEnding: boolean;
}

/**
 * ContentDto를 Model로 변환
 */
export function contentSearchFromDto(dto: ContentDto): ContentSearchModel {
  return {
    id: dto.id,
    contentType: dto.contentType as 'movie' | 'tv',
    title: dto.title,
    posterPath: dto.posterPath ?? null,
    releaseDate: dto.releaseDate ?? null,
  };
}

/**
 * VideoDto를 Model로 변환
 */
export function videoSearchFromDto(dto: VideoDto): VideoSearchModel {
  return {
    id: dto.id,
    contentId: dto.contentId,
    title: dto.title,
    runtime: dto.runtime ?? null,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    isPrimary: dto.isPrimary,
    includesEnding: dto.includesEnding,
  };
}
