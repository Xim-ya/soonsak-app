/**
 * VideoManagementModel - 비디오 관리 모델
 *
 * 어드민 비디오 처리 페이지에서 사용하는 뷰 모델
 */

import type { VideoManagementItem as VideoManagementItemDto } from '@/features/admin';
import type { ContentType } from '@/shared/types/content/contentType.enum';
import type { ContentStatus } from '@/features/content/types';

/**
 * 비디오 관리 뷰 모델
 */
export interface VideoManagementModel {
  readonly id: string;
  readonly title: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly contentTitle: string;
  readonly contentPosterPath: string | null;
  readonly channelName: string | null;
  readonly uploadedAt: string;
  readonly status: ContentStatus;
}

/**
 * DTO를 뷰 모델로 변환
 */
export function fromVideoManagementDto(dto: VideoManagementItemDto): VideoManagementModel {
  return {
    id: dto.id,
    title: dto.title,
    contentId: dto.contentId,
    contentType: dto.contentType,
    contentTitle: dto.contentTitle,
    contentPosterPath: dto.contentPosterPath,
    channelName: dto.channelName,
    uploadedAt: dto.uploadedAt,
    status: dto.status,
  };
}
