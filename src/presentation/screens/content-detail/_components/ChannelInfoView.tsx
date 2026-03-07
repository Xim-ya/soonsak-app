import { useCallback } from 'react';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import styled from '@emotion/native';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';
import { Pressable } from 'react-native';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import { useYouTubeChannel } from '@/features/youtube';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { analyticsService } from '@/core/services/analytics';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';

/**
 *  채널 정보를 보여주는 뷰
 */
function ChannelInfoView() {
  const { primaryVideo } = useContentVideos();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: contentId } = useContentDetailRoute();

  // 현재 선택된 대표 비디오의 채널 ID를 사용
  const channelId = primaryVideo?.channelId;
  const { data: channel, isLoading, error } = useYouTubeChannel(channelId);

  const handlePress = useCallback(() => {
    if (isLoading || error || !channelId || !channel) return;

    // GA4 content_detail_channel_click 이벤트 로깅
    analyticsService.contentDetailChannelClick({
      channel_id: channelId,
      channel_name: channel.name,
      content_id: Number(contentId),
    });

    navigation.navigate(routePages.channelDetail, {
      channelId: channelId,
      channelName: channel.name,
      channelLogoUrl: channel.images?.avatar,
      subscriberCount: channel.subscriberCount,
    });
  }, [isLoading, error, channelId, channel, navigation, contentId]);

  // 채널 ID가 없거나 에러 시 빈 컴포넌트 반환
  if (!channelId || error) {
    return null;
  }

  return (
    <Container>
      <SectionTitle>채널</SectionTitle>
      <Gap size={8} />

      <Pressable onPress={handlePress}>
        <InfoWrapper>
          <ChannelLogoImage source={channel?.images?.avatar || ''} size={64} />
          <ColumnWrapper>
            {isLoading ? (
              <>
                <SkeletonView width={90} height={22} borderRadius={4} />
                <Gap size={4} />
                <SkeletonView width={40} height={20} borderRadius={4} />
              </>
            ) : (
              <>
                <Name>{channel?.name}</Name>
                {channel?.subscriberText && (
                  <SubscriberCount>{channel.subscriberText}명</SubscriberCount>
                )}
              </>
            )}
          </ColumnWrapper>
          <RightArrowIcon style={{ width: 24, height: 24 }} />
        </InfoWrapper>
      </Pressable>
    </Container>
  );
}

const Container = styled.View({
  paddingTop: 24,
  paddingHorizontal: 16,
  paddingBottom: 40,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
});

const InfoWrapper = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const ColumnWrapper = styled.View({
  paddingLeft: 12,
  flexDirection: 'column',
  justifyContent: 'center',
  flex: 1,
});

const Name = styled.Text({
  ...textStyles.body1,
});

const SubscriberCount = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
});

export { ChannelInfoView };
