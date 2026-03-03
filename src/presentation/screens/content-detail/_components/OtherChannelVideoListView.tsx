import React, { useMemo, useCallback } from 'react';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import DarkChip from '@/presentation/components/chip/DarkChip';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter } from '@/shared/utils/formatter';
import styled from '@emotion/native';
import { FlatList, TouchableOpacity } from 'react-native';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { useYouTubeChannel } from '@/features/youtube';
import { OtherChannelVideoModel } from '../_types/otherChannelVideoModel.cd';

interface VideoItemViewProps {
  item: OtherChannelVideoModel;
  onPress: (item: OtherChannelVideoModel) => void;
}

// 비디오 아이템 컴포넌트
const VideoItemView = React.memo(({ item, onPress }: VideoItemViewProps) => {
  const { data: channel } = useYouTubeChannel(item.channelId);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  // 런타임 포맷팅
  const runtimeText = item.runtime ? formatter.formatRuntime(item.runtime) : undefined;

  return (
    <VideoItemContainer>
      <ThumbnailTouchable onPress={handlePress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          <LoadableImageView
            source={item.thumbnailUrl}
            width={THUMBNAIL_WIDTH}
            height={THUMBNAIL_HEIGHT}
            borderRadius={THUMBNAIL_BORDER_RADIUS}
          />
          <DarkedLinearShadow height={THUMBNAIL_HEIGHT} align={LinearAlign.bottomTop} />
          {/* 좌측 하단 채널 정보 */}
          <ChannelInfoWrapper>
            <ChannelLogoImage source={channel?.images?.avatar ?? ''} size={28} />
            <Gap size={8} />
            <ChannelName numberOfLines={1}>{channel?.name ?? ''}</ChannelName>
          </ChannelInfoWrapper>
          {/* 우측 하단 러닝타임 */}
          {runtimeText && (
            <RuntimeChipWrapper>
              <DarkChip content={runtimeText} />
            </RuntimeChipWrapper>
          )}
        </ThumbnailWrapper>
      </ThumbnailTouchable>
      <Gap size={8} />
      <VideoTitle numberOfLines={2}>{item.title}</VideoTitle>
    </VideoItemContainer>
  );
});

VideoItemView.displayName = 'VideoItemView';

/** 아이템 간격 컴포넌트 (렌더링 최적화) */
const ItemSeparator = React.memo(() => <Gap size={ITEM_GAP} />);
ItemSeparator.displayName = 'OtherVideoItemSeparator';

function OtherChannelVideoListView() {
  const { videos, primaryVideo, switchToVideo } = useContentVideos();

  // primaryVideo를 제외한 나머지 비디오들을 Model로 변환
  // 정렬은 DB에서 처리됨 (includes_ending DESC, runtime DESC)
  const otherVideos = useMemo(() => {
    const filteredVideos = primaryVideo
      ? videos.filter((video) => video.id !== primaryVideo.id)
      : videos;

    return OtherChannelVideoModel.fromDtoList(filteredVideos);
  }, [videos, primaryVideo]);

  // 아이템 클릭 핸들러
  const handleItemPress = useCallback(
    (item: OtherChannelVideoModel) => {
      switchToVideo(item.id, item.thumbnailUrl);
    },
    [switchToVideo],
  );

  // renderItem 메모이제이션
  const renderItem = useCallback(
    ({ item }: { item: OtherChannelVideoModel }) => (
      <VideoItemView item={item} onPress={handleItemPress} />
    ),
    [handleItemPress],
  );

  // keyExtractor 메모이제이션
  const keyExtractor = useCallback((item: OtherChannelVideoModel) => item.id, []);

  // getItemLayout - 스크롤 성능 최적화
  const getItemLayout = useCallback(
    (_: ArrayLike<OtherChannelVideoModel> | null | undefined, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

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
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={3}
        initialNumToRender={3}
      />
    </Container>
  );
}

/* Styled Components */
// 16:9 비율 유지
const THUMBNAIL_WIDTH = AppSize.ratioWidth(240);
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (9 / 16);
const THUMBNAIL_BORDER_RADIUS = 8;

// 스냅 간격: 아이템 너비 + 간격
const ITEM_GAP = 12;
const SNAP_INTERVAL = THUMBNAIL_WIDTH + ITEM_GAP;

// 정보 영역 높이
const INFO_SECTION_GAP = 8;
const VIDEO_TITLE_LINE_HEIGHT = 22;
const VIDEO_TITLE_MAX_LINES = 2;
const INFO_SECTION_HEIGHT = VIDEO_TITLE_LINE_HEIGHT * VIDEO_TITLE_MAX_LINES;

// 전체 아이템 높이
const ITEM_HEIGHT = THUMBNAIL_HEIGHT + INFO_SECTION_GAP + INFO_SECTION_HEIGHT;

const Container = styled.View({
  backgroundColor: colors.black,
  paddingTop: 24,
  paddingBottom: 40,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  paddingLeft: 16,
});

const VideoItemContainer = styled.View({
  width: THUMBNAIL_WIDTH,
  height: ITEM_HEIGHT,
});

const VideoListView = styled(FlatList<OtherChannelVideoModel>)({
  paddingHorizontal: 16,
});

const ThumbnailTouchable = styled(TouchableOpacity)({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
});

const ThumbnailWrapper = styled.View({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
  borderRadius: THUMBNAIL_BORDER_RADIUS,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const ChannelInfoWrapper = styled.View({
  position: 'absolute',
  bottom: 10,
  left: 10,
  flexDirection: 'row',
  alignItems: 'center',
  maxWidth: '60%',
});

const ChannelName = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  flex: 1,
});

const RuntimeChipWrapper = styled.View({
  position: 'absolute',
  bottom: 10,
  right: 10,
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  lineHeight: VIDEO_TITLE_LINE_HEIGHT,
});

export { OtherChannelVideoListView };
