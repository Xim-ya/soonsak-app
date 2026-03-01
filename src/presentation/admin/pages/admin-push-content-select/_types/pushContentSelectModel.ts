import type { ContentDto, VideoDto } from '@/features/content/types';

/**
 * 푸시 알림용 콘텐츠 모델
 * ContentDto를 UI에 필요한 형태로 변환
 */
export interface PushContentModel {
  readonly contentId: number;
  readonly contentTitle: string;
  readonly contentType: 'movie' | 'tv';
  readonly posterPath?: string;
  readonly releaseYear?: string;
}

/**
 * 푸시 알림용 비디오 모델
 * VideoDto를 UI에 필요한 형태로 변환
 */
export interface PushVideoModel {
  readonly videoId: string;
  readonly videoTitle: string;
  readonly thumbnailUrl?: string;
  readonly runtime?: number;
  readonly isPrimary: boolean;
  readonly includesEnding: boolean;
}

/**
 * ContentDto를 PushContentModel로 변환
 */
export function contentFromDto(dto: ContentDto): PushContentModel {
  return {
    contentId: dto.id,
    contentTitle: dto.title,
    contentType: dto.contentType as 'movie' | 'tv',
    posterPath: dto.posterPath,
    releaseYear: dto.releaseDate?.slice(0, 4),
  };
}

/**
 * VideoDto를 PushVideoModel로 변환
 */
export function videoFromDto(dto: VideoDto): PushVideoModel {
  return {
    videoId: dto.id,
    videoTitle: dto.title,
    thumbnailUrl: dto.thumbnailUrl,
    runtime: dto.runtime,
    isPrimary: dto.isPrimary,
    includesEnding: dto.includesEnding,
  };
}
