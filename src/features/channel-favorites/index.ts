/**
 * Channel Favorites Feature Module
 * 채널 찜하기 기능
 */

// Types (DTO)
export type {
  ChannelFavoriteDto,
  ToggleChannelFavoriteParams,
  ChannelFavoriteStatusResponse,
} from './types';

// Types (Model)
export { ChannelFavoriteStatusModel } from './types/channelFavoriteModel';
export type { ChannelFavoriteStatusModel as ChannelFavoriteStatusModelType } from './types/channelFavoriteModel';

// API
export { channelFavoritesApi } from './api/channelFavoritesApi';

// Hooks
export {
  channelFavoriteKeys,
  useFavoriteChannelIds,
  useChannelFavoriteStatus,
  useToggleChannelFavorite,
} from './hooks/useChannelFavorites';
