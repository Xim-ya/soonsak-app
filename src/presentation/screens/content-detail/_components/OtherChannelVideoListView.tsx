import { useMemo, useCallback } from 'react';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import styled from '@emotion/native';
import { FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { useYouTubeChannel } from '@/features/youtube';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import PlayButtonSvg from '@assets/icons/play_button.svg';
import { OtherChannelVideoModel } from '../_types/otherChannelVideoModel.cd';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { useContentDetail } from '../_hooks/useContentDetail';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface VideoItemViewProps {
  item: OtherChannelVideoModel;
  contentTitle: string;
}

// 비디오 아이템 컴포넌트 (훅 사용을 위해 별도 분리)
function VideoItemView({ item, contentTitle }: VideoItemViewProps) {
  const { data: channel } = useYouTubeChannel(item.channelId);
  const navigation = useNavigation<NavigationProp>();

  const handlePlayPress = useCallback(() => {
    if (!item.contentType) return;

    navigation.navigate(routePages.player, {
      videoId: item.id,
      title: contentTitle || item.title,
      contentId: item.contentId,
      contentType: item.contentType,
    });
  }, [navigation, item, contentTitle]);

  return (
    <VideoItemContainer>
      <ThumbnailTouchable onPress={handlePlayPress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          <LoadableImageView
            source={item.thumbnailUrl}
            width={thumbnailWidth}
            height={thumbnailHeight}
            borderRadius={4}
          />
          <DarkedLinearShadow height={thumbnailHeight} align={LinearAlign.bottomTop} />
          {/* 재생 버튼 아이콘 */}
          <PlayButtonContainer>
            <PlayButtonSvg width={64} height={64} />
          </PlayButtonContainer>
          <ChannelInfoWrapper>
            <ChannelLogoImage source={channel?.images?.avatar ?? ''} size={28} />
            <Gap size={8} />
            <ChannelName numberOfLines={1}>{channel?.name ?? ''}</ChannelName>
          </ChannelInfoWrapper>
        </ThumbnailWrapper>
      </ThumbnailTouchable>
      <Gap size={6} />
      <VideoTitle numberOfLines={2}>{item.title}</VideoTitle>
    </VideoItemContainer>
  );
}

function OtherChannelVideoListView() {
  const { videos, primaryVideo } = useContentVideos();
  const { id, type } = useContentDetailRoute();
  const { data: contentDetail } = useContentDetail(Number(id), type);

  // 콘텐츠 제목
  const contentTitle = contentDetail?.title ?? '';

  // primaryVideo를 제외한 나머지 비디오들을 Model로 변환
  // 정렬은 DB에서 처리됨 (includes_ending DESC, runtime DESC)
  const otherVideos = useMemo(() => {
    const filteredVideos = primaryVideo
      ? videos.filter((video) => video.id !== primaryVideo.id)
      : videos;

    return OtherChannelVideoModel.fromDtoList(filteredVideos);
  }, [videos, primaryVideo]);

  // 다른 비디오가 없으면 섹션 숨김
  if (otherVideos.length === 0) {
    return null;
  }

  return (
    <Container>
      <SectionTitle>다른 영상</SectionTitle>
      <Gap size={10} />
      <VideoListView
        horizontal
        data={otherVideos}
        renderItem={({ item }) => <VideoItemView item={item} contentTitle={contentTitle} />}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Gap size={12} />}
        showsHorizontalScrollIndicator={false}
      />
    </Container>
  );
}

/* Styled Components */
const thumbnailWidth = AppSize.ratioWidth(196);
const thumbnailHeight = thumbnailWidth * (122 / 196);

const Container = styled.View({
  backgroundColor: colors.black,
  paddingTop: 24,
  paddingBottom: 40,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  paddingLeft: 16,
});

const VideoItemContainer = styled.View({
  width: thumbnailWidth,
});

const VideoListView = styled(FlatList<OtherChannelVideoModel>)({
  paddingLeft: 16,
});

const ThumbnailTouchable = styled(TouchableOpacity)({
  width: thumbnailWidth,
  height: thumbnailHeight,
});

const ThumbnailWrapper = styled.View({
  width: thumbnailWidth,
  height: thumbnailHeight,
  borderRadius: 4,
  overflow: 'hidden',
  backgroundColor: 'black',
});

const PlayButtonContainer = styled.View({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 64,
  height: 64,
  transform: [{ translateX: -32 }, { translateY: -32 }],
  zIndex: 10,
});

const VideoTitle = styled.Text({
  ...textStyles.body3,
  color: colors.white,
});

const ChannelInfoWrapper = styled.View({
  position: 'absolute',
  bottom: 8,
  left: 8,
  right: 8,
  flexDirection: 'row',
  alignItems: 'center',
});

const ChannelName = styled.Text({
  ...textStyles.alert1,
  color: colors.gray03,
  flex: 1,
});

export { OtherChannelVideoListView };
