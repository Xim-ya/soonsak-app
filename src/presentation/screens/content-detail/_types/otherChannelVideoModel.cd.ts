/* eslint-disable @typescript-eslint/no-namespace */
import { VideoDto } from '@/features/content/types';
import { ContentType } from '@/core/types/content/contentType.enum';

/**
 * OtherChannelVideoModel - 다른 채널 영상 모델
 *
 * 콘텐츠 상세 페이지의 '다른 채널 영상' 섹션에서 사용되는 비디오 정보 모델
 * UI 렌더링과 네비게이션에 필요한 필드만 포함
 */
export interface OtherChannelVideoModel {
  /** 비디오 고유 ID (YouTube Video ID) */
  readonly id: string;
  /** 비디오 제목 */
  readonly title: string;
  /** 썸네일 이미지 URL */
  readonly thumbnailUrl: string;
  /** 채널 ID (YouTube Channel ID) */
  readonly channelId: string;
  /** 연결된 콘텐츠 ID */
  readonly contentId: number;
  /** 콘텐츠 타입 (movie, tv 등) */
  readonly contentType: ContentType | undefined;
  /** 런타임 (초 단위) */
  readonly runtime?: number;
}

export namespace OtherChannelVideoModel {
  /**
   * VideoDto를 OtherChannelVideoModel로 변환
   * @param dto - VideoDto
   * @returns OtherChannelVideoModel
   */
  export function fromDto(dto: VideoDto): OtherChannelVideoModel {
    return {
      id: dto.id,
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl ?? '',
      channelId: dto.channelId ?? '',
      contentId: dto.contentId,
      contentType: dto.contentType,
      runtime: dto.runtime,
    };
  }

  /**
   * VideoDto 배열을 OtherChannelVideoModel 배열로 변환
   * @param dtoList - VideoDto 배열
   * @returns OtherChannelVideoModel 배열
   */
  export function fromDtoList(dtoList: VideoDto[]): OtherChannelVideoModel[] {
    return dtoList.map(fromDto);
  }
}
