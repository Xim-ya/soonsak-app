/**
 * ISO 8601 형식의 타임스탬프 문자열 타입
 */
type ISOTimestamp = string;

/**
 * 채널 찜 DTO
 * channel_favorites 테이블과 1대1 대응
 * user_id + channel_id로 유니크
 */
interface ChannelFavoriteDto {
  readonly id: string;
  readonly userId: string;
  readonly channelId: string;
  readonly createdAt: ISOTimestamp;
}

/**
 * 채널 찜 토글 파라미터
 */
interface ToggleChannelFavoriteParams {
  readonly channelId: string;
}

/**
 * 채널 찜 상태 응답
 */
interface ChannelFavoriteStatusResponse {
  readonly isFavorited: boolean;
  readonly favoriteId: string | null;
}

export type {
  ISOTimestamp,
  ChannelFavoriteDto,
  ToggleChannelFavoriteParams,
  ChannelFavoriteStatusResponse,
};
