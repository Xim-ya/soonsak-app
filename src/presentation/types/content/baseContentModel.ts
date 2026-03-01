import { ContentDto } from '@/features/content/types';
import { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * BaseContentModel - 콘텐츠 기본 모델
 *
 * 콘텐츠를 표현하는 모델들의 공통 필드를 정의합니다.
 * TrendingContentModel, PosterContentModel, TopContentModel 등에서 확장하여 사용합니다.
 */
export interface BaseContentModel {
  readonly id: number;
  readonly title: string;
  readonly type: ContentType;
  /** 포스터 이미지 경로 (TMDB 상대 경로) */
  readonly posterPath: string | undefined;
  /** 배경 이미지 경로 (TMDB 상대 경로) */
  readonly backdropPath: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BaseContentModel {
  export function fromContentDto(dto: ContentDto): BaseContentModel {
    const validTypes: ContentType[] = ['movie', 'tv', 'unknown'];
    const contentType: ContentType = validTypes.includes(dto.contentType)
      ? dto.contentType
      : 'unknown';

    return {
      id: dto.id,
      title: dto.title ?? '제목 없음',
      type: contentType,
      posterPath: dto.posterPath ?? undefined,
      backdropPath: dto.backdropPath ?? undefined,
    };
  }
}
