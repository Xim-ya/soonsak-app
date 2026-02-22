import { useCallback } from 'react';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import styled from '@emotion/native';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';
import { Pressable } from 'react-native';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import { useYouTubeChannel } from '@/features/youtube';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';

/**
 *  채널 정보를 보여주는 뷰
 */
function ChannelInfoView() {
  const { primaryVideo } = useContentVideos();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 현재 선택된 대표 비디오의 채널 ID를 사용
  const channelId = primaryVideo?.channelId;
  const { data: channel, isLoading, error } = useYouTubeChannel(channelId);

  const handlePress = useCallback(() => {
    if (isLoading || error || !channelId || !channel) return;

    navigation.navigate(routePages.channelDetail, {
      channelId: channelId,
      channelName: channel.name,
      channelLogoUrl: channel.images?.avatar,
      subscriberCount: channel.subscriberCount,
    });
  }, [isLoading, error, channelId, channel, navigation]);

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
          <RoundedAvatorView source={channel?.images?.avatar || ''} size={64} />
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
