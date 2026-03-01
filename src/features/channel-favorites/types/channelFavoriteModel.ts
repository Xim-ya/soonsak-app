import type { ChannelFavoriteStatusResponse } from './index';

/**
 * ChannelFavoriteStatusModel - 채널 찜 상태 UI 모델
 */
export interface ChannelFavoriteStatusModel {
  readonly isFavorited: boolean;
  readonly favoriteId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChannelFavoriteStatusModel {
  export function fromDto(dto: ChannelFavoriteStatusResponse): ChannelFavoriteStatusModel {
    return {
      isFavorited: dto.isFavorited,
      favoriteId: dto.favoriteId,
    };
  }
}
