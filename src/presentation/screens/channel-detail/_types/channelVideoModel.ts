/* eslint-disable @typescript-eslint/no-namespace */
import { VideoWithContentDto } from '@/features/content/types';
import type { BaseContentRefModel } from '@/core/types/content/baseContentRefModel';

/**
 * ChannelVideoModel - 채널 상세 페이지의 비디오 아이템 모델
 *
 * BaseContentRefModel을 확장하여 비디오 표시에 필요한 추가 필드를 포함합니다.
 * VideoWithContentDto에서 UI 표시에 필요한 필드만 추출한 Presentation Layer 모델입니다.
 * 그리드 뷰와 리스트 뷰 모두에서 사용합니다.
 */
export interface ChannelVideoModel extends BaseContentRefModel {
  /** YouTube 비디오 ID */
  readonly id: string;
  /** 비디오 제목 (YouTube 영상 제목) */
  readonly videoTitle: string;
  /** YouTube 썸네일 URL */
  readonly thumbnailUrl: string | undefined;
  /** 비디오 런타임 (초) */
  readonly runtime: number | undefined;
  /** 업로드 일시 (ISO 타임스탬프) */
  readonly uploadedAt: string;
}

export namespace ChannelVideoModel {
  /**
   * VideoWithContentDto를 ChannelVideoModel로 변환
   */
  export function fromDto(dto: VideoWithContentDto): ChannelVideoModel {
    return {
      id: dto.id,
      contentId: dto.contentId,
      contentType: dto.contentType!,
      contentTitle: dto.contentTitle,
      contentPosterPath: dto.contentPosterPath,
      videoTitle: dto.title,
      thumbnailUrl: dto.thumbnailUrl,
      runtime: dto.runtime,
      uploadedAt: dto.uploadedAt,
    };
  }

  /**
   * VideoWithContentDto 배열을 ChannelVideoModel 배열로 변환
   */
  export function fromDtoList(dtoList: VideoWithContentDto[]): ChannelVideoModel[] {
    return dtoList.map(fromDto);
  }
}
