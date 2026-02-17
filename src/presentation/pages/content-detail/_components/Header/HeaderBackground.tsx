import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { TouchableHighlight, TouchableOpacity, Animated } from 'react-native';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import PlayButtonSvg from '@assets/icons/play_button.svg';
import DarkChip from '@/presentation/components/chip/DarkChip';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { useContentDetail } from '../../_hooks/useContentDetail';
import { useContentVideos } from '../../_provider/ContentDetailProvider';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { AppSize } from '@/shared/utils/appSize';
import { useImageTransition } from '../../_hooks/useImageTransition';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useYouTubeVideo, buildYouTubeUrl } from '@/features/youtube';
import { useContentDetailRoute } from '../../_hooks/useContentDetailRoute';
import {
  shouldShowProgressBar,
  calculateProgressPercent,
} from '@/presentation/components/progress';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 헤더 배경 이미지와 재생 버튼을 포함하는 컴포넌트
 *
 * 책임:
 * - TMDB/YouTube 배경 이미지 전환 애니메이션
 * - 재생 버튼 및 이어보기 기능
 * - 시청 진행률 표시
 * - 런타임 칩 표시
 */
export const HeaderBackground = React.memo(() => {
  const { id, type } = useContentDetailRoute();
  const { data: contentInfo } = useContentDetail(Number(id), type);
  const { primaryVideo, watchProgress } = useContentVideos();

  const { toggleImages, opacityValues } = useImageTransition();
  const navigation = useNavigation<NavigationProp>();

  // YouTube 데이터 가져오기 - primaryVideo가 있을 때만 요청
  const youtubeUrl = primaryVideo ? buildYouTubeUrl(primaryVideo.id) : null;
  const { data: videoInfo, isLoading: youtubeLoading } = useYouTubeVideo(youtubeUrl ?? '');

  // YouTube 이미지 페이드인 애니메이션
  const youtubeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!youtubeLoading && videoInfo?.thumbnails?.high) {
      Animated.timing(youtubeOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else if (youtubeLoading) {
      youtubeOpacity.setValue(0);
    }
  }, [youtubeLoading, videoInfo?.thumbnails?.high, youtubeOpacity]);

  // 썸네일 크기 계산
  const thumbnailSize = useMemo(() => {
    const height = AppSize.ratioHeight(32);
    const width = height * (16 / 9);
    return { width, height };
  }, []);

  // 이미지 URL 메모이제이션
  const imageUrls = useMemo(
    () => ({
      youtube: videoInfo?.thumbnails?.high || '',
      tmdb: contentInfo?.backdropPath
        ? formatter.prefixTmdbImgUrl(contentInfo.backdropPath, { size: TmdbImageSize.w780 })
        : '',
    }),
    [contentInfo?.backdropPath, videoInfo?.thumbnails?.high],
  );

  // 콘텐츠 제목
  const contentTitle = contentInfo?.title ?? '';

  // 이어보기 가능 여부 판단 - 복잡한 조건에 명시적 이름 부여
  const isSameVideo = watchProgress?.videoId === primaryVideo?.id;
  const hasValidProgress = shouldShowProgressBar(
    watchProgress?.progressSeconds ?? 0,
    watchProgress?.durationSeconds ?? 0,
  );
  const canResume = isSameVideo && hasValidProgress;

  // 재생 버튼 핸들러
  const handlePlayPress = useCallback(() => {
    if (!primaryVideo) return;

    const playerParams = {
      videoId: primaryVideo.id,
      title: primaryVideo.title || contentTitle || '',
      contentId: Number(id),
      contentType: type,
      ...(canResume && { startSeconds: watchProgress!.progressSeconds }),
    };

    navigation.navigate(routePages.player, playerParams);
  }, [navigation, primaryVideo, contentTitle, id, type, canResume, watchProgress]);

  // 썸네일 클릭 핸들러
  const handleThumbnailPress = useCallback(() => {
    toggleImages();
  }, [toggleImages]);

  // UI 상태 파생 - 복잡한 조건에 명시적 이름 부여
  const hasRuntimeInfo = primaryVideo?.runtime != null && primaryVideo.runtime > 0;
  const showRuntimeChip = !hasValidProgress && hasRuntimeInfo;

  // 진행률 계산
  const progressPercent = calculateProgressPercent(
    watchProgress?.progressSeconds ?? 0,
    watchProgress?.durationSeconds ?? 0,
  );

  return (
    <Container>
      <ImageWrapper>
        {/* TMDB 배경 이미지 */}
        {imageUrls.tmdb && (
          <AnimatedBackgroundImage
            source={{ uri: imageUrls.tmdb }}
            style={{ opacity: opacityValues.primary }}
          />
        )}
        {/* YouTube 배경 이미지 */}
        {imageUrls.youtube && (
          <AnimatedBackgroundImage
            source={{ uri: imageUrls.youtube }}
            style={{
              opacity: Animated.multiply(opacityValues.secondary, youtubeOpacity),
            }}
          />
        )}
      </ImageWrapper>

      {/* 상단 그라데이션 그림자 */}
      <GradientWrapper>
        <DarkedLinearShadow height={88} align={LinearAlign.topBottom} />
      </GradientWrapper>

      {/* 하단 그라데이션 그림자 */}
      <GradientWrapper>
        <DarkedLinearShadow height={88} align={LinearAlign.bottomTop} />
      </GradientWrapper>

      {/* 재생 버튼 */}
      <PlayButtonContainer>
        <PlayButton
          onPress={handlePlayPress}
          underlayColor="rgba(255, 255, 255, 0.02)"
          delayPressIn={100}
        >
          <PlayButtonSvg width={120} height={120} />
        </PlayButton>
        {/* 이어서 보기 텍스트 */}
        {hasValidProgress && <ResumeText>이어서 보기</ResumeText>}
      </PlayButtonContainer>

      {/* 런타임 칩 - 좌측 하단 (시청 기록 없을 때만) */}
      {showRuntimeChip && (
        <RuntimeChipContainer>
          <DarkChip content={formatter.formatRuntime(primaryVideo!.runtime!)} />
        </RuntimeChipContainer>
      )}

      {/* 시청 진행률 - 하단 전체 */}
      {hasValidProgress && (
        <ProgressContainer>
          <DarkChip content={formatter.formatRuntime(watchProgress!.progressSeconds)} />
          <ProgressBarWrapper>
            <ProgressBarTrack />
            <ProgressBarFill style={{ width: `${progressPercent}%` }} />
          </ProgressBarWrapper>
        </ProgressContainer>
      )}

      {/* 비디오 썸네일 - 우측 하단 */}
      <VideoThumbnailContainer>
        <TouchableOpacity onPress={handleThumbnailPress} activeOpacity={1}>
          <ThumbnailWrapper width={thumbnailSize.width} height={thumbnailSize.height}>
            {/* TMDB 썸네일 */}
            {imageUrls.tmdb && (
              <Animated.View style={{ position: 'absolute', opacity: opacityValues.secondary }}>
                <LoadableImageView
                  source={imageUrls.tmdb}
                  width={thumbnailSize.width}
                  height={thumbnailSize.height}
                  borderRadius={2}
                />
              </Animated.View>
            )}
            {/* YouTube 썸네일 */}
            {imageUrls.youtube && (
              <Animated.View
                style={{
                  position: 'absolute',
                  opacity: Animated.multiply(opacityValues.primary, youtubeOpacity),
                }}
              >
                <LoadableImageView
                  source={imageUrls.youtube}
                  width={thumbnailSize.width}
                  height={thumbnailSize.height}
                  borderRadius={2}
                />
              </Animated.View>
            )}
          </ThumbnailWrapper>
        </TouchableOpacity>
      </VideoThumbnailContainer>
    </Container>
  );
});

HeaderBackground.displayName = 'HeaderBackground';

/* Styled Components - HeaderBackground 전용 */
const Container = styled.View({
  position: 'relative',
  width: '100%',
  aspectRatio: 375 / 240,
  overflow: 'hidden',
  pointerEvents: 'box-none' as const,
});

const ImageWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none' as const,
});

const GradientWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none' as const,
});

const PlayButtonContainer = styled.View({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: [{ translateX: -60 }, { translateY: -60 }],
  zIndex: 10,
  alignItems: 'center',
});

const PlayButton = styled(TouchableHighlight)({
  borderRadius: 60,
});

const ResumeText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  position: 'absolute',
  bottom: 8,
  opacity: 0.8,
});

const RuntimeChipContainer = styled.View({
  position: 'absolute',
  bottom: AppSize.ratioHeight(12),
  left: AppSize.ratioWidth(12),
  zIndex: 11,
});

const VideoThumbnailContainer = styled.View({
  position: 'absolute',
  bottom: AppSize.ratioHeight(12),
  right: AppSize.ratioWidth(12),
  zIndex: 11,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
});

const AnimatedBackgroundImage = styled(Animated.Image)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
});

const ThumbnailWrapper = styled.View<{ width: number; height: number }>(({ width, height }) => ({
  width,
  height,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 2,
}));

const ProgressContainer = styled.View({
  position: 'absolute',
  bottom: AppSize.ratioHeight(12),
  left: AppSize.ratioWidth(12),
  right: AppSize.ratioWidth(12) + AppSize.ratioHeight(32) * (16 / 9) + 8,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 11,
});

const ProgressBarWrapper = styled.View({
  flex: 1,
  height: 4,
  marginLeft: 8,
  position: 'relative',
});

const ProgressBarTrack = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  borderRadius: 2,
});

const ProgressBarFill = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  backgroundColor: colors.red,
  borderRadius: 2,
});
