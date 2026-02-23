/**
 * ChannelVideoCard - 채널 페이지 비디오 카드 컴포넌트 (YouTube 스타일)
 *
 * 채널 페이지에서 사용되는 비디오 카드입니다.
 * 썸네일 하단에 콘텐츠 제목(좌) <-> 런타임 칩(우)을 오버레이로 표시합니다.
 * 썸네일 아래에 채널 아바타(좌) + 비디오 제목·년도·장르(우)를 배치합니다.
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
import DarkChip from '@/presentation/components/chip/DarkChip';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { formatter } from '@/shared/utils/formatter';
import type { ChannelVideoModel } from '../_types';

interface ChannelVideoCardProps {
  readonly video: ChannelVideoModel;
  readonly onPress: (video: ChannelVideoModel) => void;
}

// 크기 상수 (YouTube 스타일: 썸네일 전체 너비)
const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMBNAIL_WIDTH = SCREEN_WIDTH;
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (9 / 16); // 16:9 비율

// 정보 영역 패딩
const INFO_HORIZONTAL_PADDING = 12;

// 썸네일 아래 정보 영역 높이
const AVATAR_SIZE = 40;
const INFO_SECTION_GAP = 12;
const VIDEO_TITLE_LINE_HEIGHT = 22;
const VIDEO_TITLE_MAX_LINES = 2;
const META_LINE_HEIGHT = 18;
const INFO_SECTION_HEIGHT =
  VIDEO_TITLE_LINE_HEIGHT * VIDEO_TITLE_MAX_LINES + 2 + META_LINE_HEIGHT;

// 전체 카드 높이 (썸네일 + Gap + 정보 영역)
const CARD_HEIGHT = THUMBNAIL_HEIGHT + INFO_SECTION_GAP + INFO_SECTION_HEIGHT;

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
  const backdropUrl = video.backdropPath ? `${TMDB_IMAGE_BASE}${video.backdropPath}` : '';

  // 메타 정보: 년도 · 장르
  const metaParts = [video.releaseYear, video.genreText].filter(Boolean);
  const metaInfo = metaParts.join(DOT_SEPARATOR);

  // 런타임 포맷팅
  const runtimeText = video.runtime ? formatter.formatRuntime(video.runtime) : undefined;

  return (
    <Container>
      {/* 썸네일 영역 */}
      <ThumbnailTouchable onPress={handlePress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          <LoadableImageView
            source={backdropUrl}
            width={THUMBNAIL_WIDTH}
            height={THUMBNAIL_HEIGHT}
            borderRadius={0}
          />
          {/* 하단 그라데이션 오버레이 */}
          <DarkedLinearShadow height={THUMBNAIL_HEIGHT} align={LinearAlign.bottomTop} />
          {/* 하단 오버레이: 콘텐츠 제목(좌) <-> 런타임(우) */}
          <OverlayRow>
            <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
            {runtimeText && <DarkChip content={runtimeText} />}
          </OverlayRow>
        </ThumbnailWrapper>
      </ThumbnailTouchable>

      <Gap size={INFO_SECTION_GAP} />

      {/* 정보 영역: 채널 아바타 + 비디오 제목 + 메타정보 */}
      <InfoSection>
        <RoundedAvatorView source={video.channelLogoUrl} size={AVATAR_SIZE} />
        <Gap size={10} />
        <InfoColumn>
          <VideoTitle numberOfLines={VIDEO_TITLE_MAX_LINES}>{video.videoTitle}</VideoTitle>
          {metaInfo && <MetaInfo numberOfLines={1}>{metaInfo}</MetaInfo>}
        </InfoColumn>
      </InfoSection>
    </Container>
  );
});

/* Styled Components */
const Container = styled.View({
  width: SCREEN_WIDTH,
});

const ThumbnailTouchable = styled(TouchableOpacity)({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
});

const ThumbnailWrapper = styled.View({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const OverlayRow = styled.View({
  position: 'absolute',
  bottom: 12,
  left: 12,
  right: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ContentTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  flex: 1,
  marginRight: 8,
});

const InfoSection = styled.View({
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingHorizontal: INFO_HORIZONTAL_PADDING,
});

const InfoColumn = styled.View({
  flex: 1,
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  lineHeight: VIDEO_TITLE_LINE_HEIGHT,
});

const MetaInfo = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: 2,
  lineHeight: META_LINE_HEIGHT,
});

export { ChannelVideoCard, CARD_HEIGHT, THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH };
