/**
 * VideoListItem - 채널 상세 리스트 뷰 아이템 컴포넌트
 *
 * 유튜브 스타일의 가로형 레이아웃으로 비디오를 표시합니다.
 * - 좌측: 썸네일 이미지 (16:9) + 런타임 뱃지
 * - 우측: 비디오 제목 (최대 2줄), 콘텐츠 제목, 업로드일
 *
 * @example
 * <VideoListItem video={video} onPress={handlePress} />
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import DarkChip from '@/presentation/components/chip/DarkChip';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter } from '@/shared/utils/formatter';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/shared/analytics';
import { ChannelVideoModel } from '../_types';
import { useChannelDetail } from '../_provider/ChannelDetailProvider';

/** 썸네일 크기 (16:9 비율) */
const THUMBNAIL_WIDTH = AppSize.ratioWidth(160);
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (9 / 16);
const ITEM_PADDING = 16;

interface VideoListItemProps {
  readonly video: ChannelVideoModel;
}

function VideoListItemComponent({ video }: VideoListItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { channelId } = useChannelDetail();

  const handlePress = useCallback(() => {
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
  }, [navigation, video, channelId]);

  // 썸네일 URL (YouTube 썸네일 또는 기본 이미지)
  const thumbnailUrl = video.thumbnailUrl ?? '';

  // 런타임 텍스트
  const runtimeText = video.runtime ? formatter.formatRuntime(video.runtime) : '';

  // 업로드일 텍스트
  const uploadDateText = formatter.getDateDifferenceFromNow(video.uploadedAt);

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      <ThumbnailWrapper>
        <LoadableImageView
          source={thumbnailUrl}
          width={THUMBNAIL_WIDTH}
          height={THUMBNAIL_HEIGHT}
          borderRadius={8}
        />
        {runtimeText && (
          <RuntimeChipWrapper>
            <DarkChip content={runtimeText} />
          </RuntimeChipWrapper>
        )}
      </ThumbnailWrapper>
      <Gap size={12} />
      <InfoContainer>
        <VideoTitle numberOfLines={2}>{video.videoTitle || video.contentTitle}</VideoTitle>
        <Gap size={4} />
        <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
        <Gap size={2} />
        <MetaText>{uploadDateText}</MetaText>
      </InfoContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  marginHorizontal: -ITEM_PADDING,
  paddingHorizontal: ITEM_PADDING,
  paddingVertical: 12,
});

const ThumbnailWrapper = styled.View({
  position: 'relative',
  borderRadius: 8,
  overflow: 'hidden',
});

const RuntimeChipWrapper = styled.View({
  position: 'absolute',
  bottom: 6,
  right: 6,
});

const InfoContainer = styled.View({
  flex: 1,
  justifyContent: 'flex-start',
});

const VideoTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  lineHeight: 20,
});

const ContentTitle = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const MetaText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

export const VideoListItem = memo(VideoListItemComponent);
