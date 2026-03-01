/* eslint-disable @typescript-eslint/no-namespace */
import { ContentDto } from '@/features/content/types';
import { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * SearchResultModel - 검색 결과 모델
 *
 * Supabase에 등록된 콘텐츠 검색 결과를 표시하기 위한 모델
 */
export interface SearchResultModel {
  readonly id: number;
  readonly title: string;
  readonly posterPath: string | null;
  readonly contentType: ContentType;
  readonly releaseYear: string | null;
}

export namespace SearchResultModel {
  /**
   * ContentDto를 SearchResultModel로 변환
   */
  export function fromDto(dto: ContentDto): SearchResultModel {
    const releaseYear = dto.releaseDate ? new Date(dto.releaseDate).getFullYear().toString() : null;

    return {
      id: dto.id,
      title: dto.title,
      posterPath: dto.posterPath ?? null,
      contentType: dto.contentType,
      releaseYear,
    };
  }

  /**
   * ContentDto 배열을 SearchResultModel 배열로 변환
   */
  export function fromDtoList(dtoList: ContentDto[]): SearchResultModel[] {
    return dtoList.map(fromDto);
  }
}
