/* eslint-disable @typescript-eslint/no-namespace */
import { VideoWithContentDto } from '@/features/content/types';
import { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * ChannelVideoModel - 채널 상세 페이지의 비디오 아이템 모델
 *
 * VideoWithContentDto에서 UI 표시에 필요한 필드만 추출한 Presentation Layer 모델
 * 그리드 뷰와 리스트 뷰 모두에서 사용
 */
export interface ChannelVideoModel {
  /** YouTube 비디오 ID */
  readonly id: string;
  /** 연결된 콘텐츠 ID */
  readonly contentId: number;
  /** 콘텐츠 타입 (movie/tv) */
  readonly contentType: ContentType;
  /** 콘텐츠 제목 */
  readonly contentTitle: string;
  /** 콘텐츠 포스터 이미지 경로 */
  readonly contentPosterPath: string;
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
