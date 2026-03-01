/**
 * 홈 화면 대표 채널 섹션용 모델
 * Flutter ChannelModel 참고
 */
interface FeaturedChannelModel {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly subscriberCount: number;
}

/**
 * useFeaturedChannels 훅 반환 타입
 */
interface UseFeaturedChannelsResult {
  readonly data: FeaturedChannelModel[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export type { FeaturedChannelModel, UseFeaturedChannelsResult };
