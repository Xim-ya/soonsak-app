import type { BaseContentRefModel } from '@/presentation/types/content/baseContentRefModel';
import type { RatingStatusResponse, RatingWithContentDto } from './index';

/**
 * RatingStatusModel - 평점 상태 UI 모델
 * RatingStatusResponse에서 UI에 필요한 필드만 선택
 */
export interface RatingStatusModel {
  readonly hasRating: boolean;
  readonly rating: number | null;
  readonly ratingId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RatingStatusModel {
  export function fromDto(dto: RatingStatusResponse): RatingStatusModel {
    return {
      hasRating: dto.hasRating,
      rating: dto.rating,
      ratingId: dto.ratingId,
    };
  }
}

/**
 * RatingModel - 평점 UI 모델
 *
 * BaseContentRefModel을 확장하여 평점 기능에 필요한 추가 필드를 포함합니다.
 * RatingWithContentDto에서 UI에 필요한 필드만 선택합니다.
 */
export interface RatingModel extends BaseContentRefModel {
  /** 평점 레코드 ID */
  readonly id: string;
  /** 사용자가 부여한 평점 (1-5) */
  readonly rating: number;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RatingModel {
  export function fromDto(dto: RatingWithContentDto): RatingModel {
    return {
      id: dto.id,
      contentId: dto.contentId,
      contentType: dto.contentType,
      contentTitle: dto.contentTitle,
      contentPosterPath: dto.contentPosterPath,
      rating: dto.rating,
    };
  }

  export function fromDtoList(dtoList: RatingWithContentDto[]): RatingModel[] {
    return dtoList.map(fromDto);
  }
}
