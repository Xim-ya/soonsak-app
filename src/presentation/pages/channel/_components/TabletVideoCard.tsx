/**
 * TabletVideoCard - 태블릿/대형 화면용 비디오 카드 컴포넌트
 *
 * 2열 그리드 레이아웃에서 사용되는 비디오 카드입니다.
 * YouTube 태블릿 스타일: 썸네일 + 아바타/제목/채널명
 *
 * @example
 * <TabletVideoCard video={video} onPress={handlePress} cardWidth={cardWidth} />
 */

import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
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

interface TabletVideoCardProps {
  readonly video: ChannelVideoModel;
  readonly onPress: (video: ChannelVideoModel) => void;
  readonly cardWidth: number;
}

// 썸네일 아래 정보 영역 상수
const AVATAR_SIZE = 36;
const INFO_SECTION_GAP = 10;
const VIDEO_TITLE_LINE_HEIGHT = 20;
const VIDEO_TITLE_MAX_LINES = 2;
const META_LINE_HEIGHT = 16;
const INFO_SECTION_HEIGHT = VIDEO_TITLE_LINE_HEIGHT * VIDEO_TITLE_MAX_LINES + 4 + META_LINE_HEIGHT;

// TMDB backdrop 이미지 URL 생성
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

// 가운데 점 구분자
const DOT_SEPARATOR = ' · ';

/**
 * 카드 높이 계산 (외부에서 getItemLayout에 사용)
 */
export function getTabletCardHeight(cardWidth: number): number {
  const thumbnailHeight = cardWidth * (9 / 16);
  return thumbnailHeight + INFO_SECTION_GAP + INFO_SECTION_HEIGHT;
}

const TabletVideoCard = React.memo(function TabletVideoCard({
  video,
  onPress,
  cardWidth,
}: TabletVideoCardProps) {
  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  // 썸네일 높이 (16:9 비율)
  const thumbnailHeight = cardWidth * (9 / 16);

  // TMDB backdrop 이미지 URL
  const backdropUrl = video.backdropPath ? `${TMDB_IMAGE_BASE}${video.backdropPath}` : '';

  // 메타 정보: 채널명 · 년도 · 장르
  const metaParts = [video.channelName, video.releaseYear, video.genreText].filter(Boolean);
  const metaInfo = metaParts.join(DOT_SEPARATOR);

  // 런타임 포맷팅
  const runtimeText = video.runtime ? formatter.formatRuntime(video.runtime) : undefined;

  return (
    <Container style={{ width: cardWidth }}>
      {/* 썸네일 영역 */}
      <ThumbnailTouchable
        onPress={handlePress}
        activeOpacity={0.8}
        style={{ width: cardWidth, height: thumbnailHeight }}
      >
        <ThumbnailWrapper style={{ width: cardWidth, height: thumbnailHeight }}>
          <LoadableImageView
            source={backdropUrl}
            width={cardWidth}
            height={thumbnailHeight}
            borderRadius={12}
          />
          {/* 하단 그라데이션 오버레이 */}
          <DarkedLinearShadow height={thumbnailHeight} align={LinearAlign.bottomTop} />
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
const Container = styled.View({});

const ThumbnailTouchable = styled(TouchableOpacity)({});

const ThumbnailWrapper = styled.View({
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const OverlayRow = styled.View({
  position: 'absolute',
  bottom: 10,
  left: 10,
  right: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ContentTitle = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  flex: 1,
  marginRight: 6,
});

const InfoSection = styled.View({
  flexDirection: 'row',
  alignItems: 'flex-start',
});

const InfoColumn = styled.View({
  flex: 1,
});

const VideoTitle = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  lineHeight: VIDEO_TITLE_LINE_HEIGHT,
});

const MetaInfo = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: 4,
  lineHeight: META_LINE_HEIGHT,
});

export { TabletVideoCard, INFO_SECTION_HEIGHT, INFO_SECTION_GAP };
