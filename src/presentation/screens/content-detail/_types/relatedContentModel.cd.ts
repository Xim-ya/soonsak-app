/* eslint-disable @typescript-eslint/no-namespace */
import { ContentDto } from '@/features/content/types';
import { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * RelatedContentModel - 관련 콘텐츠 모델
 *
 * TMDB 추천 콘텐츠 중 Supabase에 등록된 콘텐츠를 표시하기 위한 모델
 */
export interface RelatedContentModel {
  readonly id: number;
  readonly title: string;
  readonly posterPath: string;
  readonly contentType: ContentType;
  /** TMDB 추천 콘텐츠 여부 (true: TMDB 추천, false: 장르 기반) */
  readonly isRecommended: boolean;
}

export namespace RelatedContentModel {
  /**
   * ContentDto를 RelatedContentModel로 변환
   * @param dto - ContentDto
   * @param isRecommended - TMDB 추천 콘텐츠 여부
   */
  export function fromDto(dto: ContentDto, isRecommended: boolean): RelatedContentModel {
    return {
      id: dto.id,
      title: dto.title,
      posterPath: dto.posterPath ?? '',
      contentType: dto.contentType,
      isRecommended,
    };
  }

  /**
   * ContentDto 배열을 RelatedContentModel 배열로 변환
   * @param dtoList - ContentDto 배열
   * @param isRecommended - TMDB 추천 콘텐츠 여부
   */
  export function fromDtoList(
    dtoList: ContentDto[],
    isRecommended: boolean,
  ): RelatedContentModel[] {
    return dtoList.map((dto) => fromDto(dto, isRecommended));
  }
}
