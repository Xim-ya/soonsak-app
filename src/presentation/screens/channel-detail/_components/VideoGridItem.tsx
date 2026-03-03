import styled from '@emotion/native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import ContentTypeChip from '@/presentation/components/chip/ContentTypeChip';
import DarkChip from '@/presentation/components/chip/DarkChip';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { ContentSource, analyticsService } from '@/shared/analytics';
import { ChannelVideoModel } from '../_types';
import { useChannelDetail } from '../_provider/ChannelDetailProvider';

interface VideoGridItemProps {
  video: ChannelVideoModel;
}

const ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;
const POSTER_HEIGHT = ITEM_WIDTH * (165 / 109);

export function VideoGridItem({ video }: VideoGridItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { channelId } = useChannelDetail();

  const posterUrl = formatter.prefixTmdbImgUrl(video.contentPosterPath, {
    size: TmdbImageSize.w342,
  });

  const runtimeText = video.runtime ? formatter.formatRuntime(video.runtime) : '';

  const handlePress = () => {
    // GA4 channel_video_click 이벤트 로깅
    analyticsService.channelVideoClick({
      channel_id: channelId,
      content_id: video.contentId,
      content_type: video.contentType,
      video_id: video.id,
    });

    navigation.navigate(routePages.contentDetail, {
      id: video.contentId,
      title: video.contentTitle,
      type: video.contentType,
      videoId: video.id,
      source: ContentSource.CHANNEL_DETAIL,
    });
  };

  return (
    <Container>
      <Pressable onPress={handlePress}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl}
            width={ITEM_WIDTH}
            height={POSTER_HEIGHT}
            borderRadius={4}
          />
          <ChipWrapper>
            <ContentTypeChip contentType={video.contentType} />
          </ChipWrapper>
          {runtimeText && (
            <RuntimeChipWrapper>
              <DarkChip content={runtimeText} />
            </RuntimeChipWrapper>
          )}
        </PosterWrapper>
        <TitleWrapper>
          <ContentTitle numberOfLines={2}>{video.contentTitle || '내용 없음'}</ContentTitle>
        </TitleWrapper>
      </Pressable>
    </Container>
  );
}

const Container = styled.View({
  width: ITEM_WIDTH,
  marginBottom: 24,
});

const PosterWrapper = styled.View({
  position: 'relative',
});

const ChipWrapper = styled.View({
  position: 'absolute',
  left: 5,
  top: 6,
});

const RuntimeChipWrapper = styled.View({
  position: 'absolute',
  bottom: 6,
  right: 6,
});

const TitleWrapper = styled.View({
  marginTop: 8,
  height: 28,
});

const ContentTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray01,
  lineHeight: 14,
});
