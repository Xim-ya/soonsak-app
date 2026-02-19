import { ContentDto } from '@/features/content/types';
import { ContentType } from './contentType.enum';

export interface BaseContentModel {
  readonly id: number;
  readonly title: string;
  readonly type: ContentType;
  readonly posterPath: string;
  readonly backdropPath: string;
}

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
      posterPath: dto.posterPath ?? '',
      backdropPath: dto.backdropPath ?? '',
    };
  }
}
