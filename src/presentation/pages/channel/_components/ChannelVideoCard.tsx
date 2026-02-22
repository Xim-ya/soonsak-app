/**
 * ChannelVideoCard - 채널 페이지 비디오 카드 컴포넌트
 *
 * 채널 페이지에서 사용되는 비디오 카드입니다.
 * 큰 썸네일(backdrop) 위에 채널 로고, 콘텐츠 정보를 오버레이로 표시합니다.
 * 하단에 비디오 제목을 표시합니다.
 *
 * @example
 * <ChannelVideoCard video={video} onPress={handlePress} />
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import styled from '@emotion/native';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { ChannelVideoModel } from '../_types';

interface ChannelVideoCardProps {
  readonly video: ChannelVideoModel;
  readonly onPress: (video: ChannelVideoModel) => void;
}

// 크기 상수
const HORIZONTAL_PADDING = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = CARD_WIDTH * (9 / 16); // 16:9 비율

// TMDB backdrop 이미지 URL 생성
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

// 가운데 점 구분자
const DOT_SEPARATOR = ' · ';

const ChannelVideoCard = React.memo(function ChannelVideoCard({
  video,
  onPress,
}: ChannelVideoCardProps) {
  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  // TMDB backdrop 이미지 URL
  const backdropUrl = video.backdropPath ? `${TMDB_IMAGE_BASE}${video.backdropPath}` : undefined;

  // 메타 정보: 연도 · 장르
  const metaInfo = [video.releaseYear, video.genreText].filter(Boolean).join(DOT_SEPARATOR);

  return (
    <Container>
      <ThumbnailTouchable onPress={handlePress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          <LoadableImageView
            source={backdropUrl}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            borderRadius={12}
          />
          <DarkedLinearShadow height={CARD_HEIGHT} align={LinearAlign.bottomTop} />
          <ContentInfoWrapper>
            <RoundedAvatorView source={video.channelLogoUrl} size={32} />
            <Gap size={10} />
            <ContentInfoColumn>
              <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
              {metaInfo && <MetaInfo numberOfLines={1}>{metaInfo}</MetaInfo>}
            </ContentInfoColumn>
          </ContentInfoWrapper>
        </ThumbnailWrapper>
      </ThumbnailTouchable>
      <Gap size={10} />
      <VideoTitle numberOfLines={2}>{video.videoTitle}</VideoTitle>
    </Container>
  );
});

/* Styled Components */
const Container = styled.View({
  width: CARD_WIDTH,
  marginHorizontal: HORIZONTAL_PADDING,
});

const ThumbnailTouchable = styled(TouchableOpacity)({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
});

const ThumbnailWrapper = styled.View({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const ContentInfoWrapper = styled.View({
  position: 'absolute',
  bottom: 12,
  left: 12,
  right: 12,
  flexDirection: 'row',
  alignItems: 'center',
});

const ContentInfoColumn = styled.View({
  flex: 1,
  flexDirection: 'column',
});

const ContentTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const MetaInfo = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: 2,
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  paddingHorizontal: 2,
});

export { ChannelVideoCard, CARD_WIDTH, CARD_HEIGHT, HORIZONTAL_PADDING };
