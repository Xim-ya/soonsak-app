import type { ChannelFavoriteStatusResponse } from './index';

/**
 * ChannelFavoriteStatusModel - 채널 찜 상태 UI 모델
 */
export interface ChannelFavoriteStatusModel {
  readonly isFavorited: boolean;
  readonly favoriteId: string | null;
}

/**
 * DTO를 ChannelFavoriteStatusModel로 변환
 */
export function fromChannelFavoriteStatusDto(
  dto: ChannelFavoriteStatusResponse,
): ChannelFavoriteStatusModel {
  return {
    isFavorited: dto.isFavorited,
    favoriteId: dto.favoriteId,
  };
}
