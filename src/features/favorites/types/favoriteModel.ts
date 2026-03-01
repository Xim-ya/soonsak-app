import type { BaseContentRefModel } from '@/shared/types/content/baseContentRefModel';
import type { FavoriteWithContentDto, FavoriteStatusResponse } from './index';

/**
 * FavoriteModel - 찜 UI 모델
 *
 * BaseContentRefModel을 확장하여 찜 기능에 필요한 추가 필드를 포함합니다.
 * FavoriteWithContentDto에서 UI에 필요한 필드만 선택합니다.
 */
export interface FavoriteModel extends BaseContentRefModel {
  /** 찜 레코드 ID */
  readonly id: string;
  /** 콘텐츠 배경 이미지 경로 */
  readonly contentBackdropPath: string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FavoriteModel {
  export function fromDto(dto: FavoriteWithContentDto): FavoriteModel {
    return {
      id: dto.id,
      contentId: dto.contentId,
      contentType: dto.contentType,
      contentTitle: dto.contentTitle,
      contentPosterPath: dto.contentPosterPath,
      contentBackdropPath: dto.contentBackdropPath,
    };
  }

  export function fromDtoList(dtoList: FavoriteWithContentDto[]): FavoriteModel[] {
    return dtoList.map(fromDto);
  }
}

/**
 * FavoriteStatusModel - 찜 상태 UI 모델
 */
export interface FavoriteStatusModel {
  readonly isFavorited: boolean;
  readonly favoriteId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FavoriteStatusModel {
  export function fromDto(dto: FavoriteStatusResponse): FavoriteStatusModel {
    return {
      isFavorited: dto.isFavorited,
      favoriteId: dto.favoriteId,
    };
  }
}
