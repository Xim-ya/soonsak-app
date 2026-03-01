import { ContentCollectionWithContentsDto, ContentDto } from '@/features/content/types';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';

/**
 * 콘텐츠 컬렉션 아이템 모델
 * 컬렉션 내 개별 콘텐츠 표시에 사용
 */
export interface CollectionContentModel extends BaseContentModel {
  readonly backdropPath: string | undefined;
}

/**
 * 콘텐츠 컬렉션 모델
 * 홈 화면의 큐레이션 섹션에서 사용
 */
export interface ContentCollectionModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly contents: CollectionContentModel[];
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ContentCollectionModel {
  /**
   * DTO를 Model로 변환
   */
  export function fromDto(dto: ContentCollectionWithContentsDto): ContentCollectionModel {
    const model: ContentCollectionModel = {
      id: dto.id,
      title: dto.title,
      contents: dto.contents.map(contentToModel),
    };

    if (dto.subtitle) {
      return { ...model, subtitle: dto.subtitle };
    }

    return model;
  }

  /**
   * ContentDto를 CollectionContentModel로 변환
   */
  function contentToModel(dto: ContentDto): CollectionContentModel {
    return {
      id: dto.id,
      type: dto.contentType,
      title: dto.title,
      posterPath: dto.posterPath,
      backdropPath: dto.backdropPath,
    };
  }
}
