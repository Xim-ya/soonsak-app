import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { WatchHistoryWithContentDto, WatchHistoryCalendarItemDto } from './index';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';

/**
 * WatchHistoryModel - 시청 기록 UI 모델
 * WatchHistoryWithContentDto에서 UI에 필요한 필드만 선택
 */
export interface WatchHistoryModel {
  readonly id: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoId: string;
  readonly contentTitle: string;
  readonly contentPosterPath: string;
  readonly contentBackdropPath: string;
  readonly progressSeconds: number;
  readonly durationSeconds: number;
  readonly isFullyWatched: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace WatchHistoryModel {
  export function fromDto(dto: WatchHistoryWithContentDto): WatchHistoryModel {
    return {
      id: dto.id,
      contentId: dto.contentId,
      contentType: dto.contentType,
      videoId: dto.videoId,
      contentTitle: dto.contentTitle,
      contentPosterPath: dto.contentPosterPath,
      contentBackdropPath: dto.contentBackdropPath,
      progressSeconds: dto.progressSeconds,
      durationSeconds: dto.durationSeconds,
      isFullyWatched: dto.isFullyWatched,
    };
  }

  export function fromDtoList(dtoList: WatchHistoryWithContentDto[]): WatchHistoryModel[] {
    return dtoList.map(fromDto);
  }

  /**
   * 선호 이미지 URL 반환
   * 이미지 URL 선택 로직을 중앙화하여 일관성 보장
   *
   * @param model - WatchHistoryModel 인스턴스
   * @param options - 이미지 선택 옵션
   * @param options.preferImage - 선호하는 이미지 타입 ('backdrop' | 'poster', 기본값: 'backdrop')
   * @param options.backdropSize - backdrop 이미지 크기
   * @param options.posterSize - poster 이미지 크기
   */
  export function getImageUrl(
    model: WatchHistoryModel,
    options?: {
      preferImage?: 'backdrop' | 'poster';
      backdropSize?: TmdbImageSize;
      posterSize?: TmdbImageSize;
    },
  ): string {
    const {
      preferImage = 'backdrop',
      backdropSize = TmdbImageSize.w780,
      posterSize = TmdbImageSize.w342,
    } = options ?? {};

    if (preferImage === 'poster') {
      // poster 우선
      if (model.contentPosterPath) {
        return formatter.prefixTmdbImgUrl(model.contentPosterPath, { size: posterSize });
      }
      if (model.contentBackdropPath) {
        return formatter.prefixTmdbImgUrl(model.contentBackdropPath, { size: backdropSize });
      }
    } else {
      // backdrop 우선 (기본 동작)
      if (model.contentBackdropPath) {
        return formatter.prefixTmdbImgUrl(model.contentBackdropPath, { size: backdropSize });
      }
      if (model.contentPosterPath) {
        return formatter.prefixTmdbImgUrl(model.contentPosterPath, { size: posterSize });
      }
    }

    return '';
  }
}

/**
 * WatchHistoryCalendarModel - 캘린더용 시청 기록 UI 모델
 */
export interface WatchHistoryCalendarModel {
  readonly watchedDate: string;
  readonly count: number;
  readonly firstPosterPath: string;
  readonly contentIds: number[];
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace WatchHistoryCalendarModel {
  export function fromDto(dto: WatchHistoryCalendarItemDto): WatchHistoryCalendarModel {
    return {
      watchedDate: dto.watchedDate,
      count: dto.count,
      firstPosterPath: dto.firstPosterPath,
      contentIds: dto.contentIds,
    };
  }

  export function fromDtoList(dtoList: WatchHistoryCalendarItemDto[]): WatchHistoryCalendarModel[] {
    return dtoList.map(fromDto);
  }
}
