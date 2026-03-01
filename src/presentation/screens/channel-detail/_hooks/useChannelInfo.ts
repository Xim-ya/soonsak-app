import { useYouTubeChannel } from '@/features/youtube';
import { formatter } from '@/shared/utils/formatter';

interface UseChannelInfoParams {
  channelId: string;
  channelName?: string | undefined;
  channelLogoUrl?: string | undefined;
  subscriberCount?: number | undefined;
}

interface UseChannelInfoReturn {
  displayName: string;
  displayLogoUrl: string;
  displaySubscriberCount: number;
  isChannelLoading: boolean;
  formattedSubscriberCount: string;
}

export function useChannelInfo({
  channelId,
  channelName,
  channelLogoUrl,
  subscriberCount,
}: UseChannelInfoParams): UseChannelInfoReturn {
  // route params에 채널 정보가 없으면 API로 조회
  const shouldFetchChannel = !channelName || !channelLogoUrl || subscriberCount === undefined;
  const { data: channelData, isLoading: isChannelLoading } = useYouTubeChannel(
    shouldFetchChannel ? channelId : undefined,
  );

  // route params 우선, 없으면 API 데이터 사용
  const displayName = channelName ?? channelData?.name ?? '';
  const displayLogoUrl = channelLogoUrl ?? channelData?.images?.avatar ?? '';
  const displaySubscriberCount = subscriberCount ?? channelData?.subscriberCount ?? 0;

  const formattedSubscriberCount = formatter.formatNumberWithUnit(displaySubscriberCount);

  return {
    displayName,
    displayLogoUrl,
    displaySubscriberCount,
    isChannelLoading: shouldFetchChannel && isChannelLoading,
    formattedSubscriberCount,
  };
}
