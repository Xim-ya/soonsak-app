import { useState, useEffect, useCallback, useRef } from 'react';
import styled from '@emotion/native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent } from 'react-native-youtube-bridge';
import WebView from 'react-native-webview';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { useWatchProgressSync } from '@/features/watch-history';
import { PlayerWatchProviderView } from './_components/PlayerWatchProviderView';
import {
  usePlayerReady,
  useResumePlayback,
  useFallbackPlayer,
  useScreenOrientation,
} from './_hooks';
import { useDialog } from '@/presentation/components/dialog';
import { analyticsService } from '@/shared/analytics';
import { PlayerLogger } from '@/shared/utils/logger';
import { wowPointWebhook } from '@/shared/services/wowPointWebhook';
import { useAuth } from '@/shared/providers/AuthProvider';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, typeof routePages.player>;

/**
 * YouTube 영상 재생 페이지
 * react-native-youtube-bridge를 사용하여 YouTube 영상을 재생합니다.
 * 임베드 제한(에러 150/152/153) 발생 시 YouTube 모바일 사이트로 fallback합니다.
 */
export const PlayerScreen = () => {
  const route = useRoute<PlayerScreenRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { displayName } = useAuth();
  const { videoId, title, contentId, contentType, startSeconds } = route.params;
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);
  const { showDialog, showConfirmDialog } = useDialog();

  // GA4 Analytics 상태 추적
  const hasLoggedPlayStart = useRef(false);
  const playStartTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  // 화면 방향 및 크기 관리
  const { playerWidth, playerHeight, isAndroid } = useScreenOrientation();

  const player = useYouTubePlayer(videoId, {
    autoplay: true,
    controls: true,
    playsinline: false,
    rel: false,
    muted: false,
    origin: 'https://www.youtube.com',
  });

  // Fallback 플레이어 로직
  const { isFallbackMode, handleError, openInYouTube } = useFallbackPlayer({ videoId });

  // 플레이어 준비 및 초기화 로직
  const { isPlayerReady, handleReady } = usePlayerReady({
    contentId,
    contentType,
    videoId,
    isFallbackMode,
    player,
  });

  // 이어보기 로직
  const { handleResumeOnStateChange } = useResumePlayback({
    startSeconds,
    player,
  });

  // 시청 진행률 동기화 (cleanup 시 자동 동기화 포함)
  const { updateProgress, handleStateChange } = useWatchProgressSync({
    contentId,
    contentType,
    videoId,
    nickname: displayName,
    videoTitle: title,
  });

  // 플레이어 준비 완료 이벤트
  useYouTubeEvent(player, 'ready', handleReady);

  // GA4 content_play_start 이벤트 로깅 및 와우 포인트 웹훅
  const logPlayStart = useCallback(() => {
    if (!hasLoggedPlayStart.current) {
      hasLoggedPlayStart.current = true;
      const isResume = (startSeconds ?? 0) > 0;
      playStartTimeRef.current = startSeconds ?? 0;

      analyticsService.contentPlayStart({
        content_id: contentId,
        content_type: contentType,
        video_id: videoId,
        is_resume: isResume,
        start_seconds: startSeconds ?? 0,
      });

      // 와우 포인트 웹훅: 영상 재생 시작 알림
      wowPointWebhook.onVideoPlay({
        nickname: displayName,
        videoTitle: title,
      });
    }
  }, [contentId, contentType, videoId, startSeconds, displayName, title]);

  // GA4 content_play_end 이벤트 로깅 (언마운트 시)
  useEffect(() => {
    return () => {
      // 재생을 시작한 적이 있고, duration 정보가 있을 때만 로깅
      if (hasLoggedPlayStart.current && totalDurationRef.current > 0) {
        const watchDuration = currentTimeRef.current;
        const totalDuration = totalDurationRef.current;
        const completionRate = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;

        analyticsService.contentPlayEnd({
          content_id: contentId,
          content_type: contentType,
          video_id: videoId,
          watch_duration: Math.floor(watchDuration),
          total_duration: Math.floor(totalDuration),
          completion_rate: Math.round(completionRate * 10) / 10, // 소수점 1자리
        });
      }
    };
  }, [contentId, contentType, videoId]);

  // 재생 상태 변경 이벤트
  useYouTubeEvent(player, 'stateChange', (state) => {
    PlayerLogger.log('재생 상태 변경:', state);

    const stateValue = typeof state === 'number' ? state : (state as { state: number }).state;

    // YouTube PlayerState: 1 = PLAYING
    if (stateValue === 1) {
      logPlayStart();
    }

    handleResumeOnStateChange(stateValue);
    handleStateChange(stateValue);
  });

  // 재생율 변경 이벤트
  const onPlaybackRateChange = useCallback((rate: number) => {
    PlayerLogger.log('재생율 변경됨:', rate);
    setCurrentPlaybackRate(rate);

    if (rate !== 1) {
      PlayerLogger.log(`재생 속도가 ${rate}배로 변경되었습니다`);
    }
  }, []);

  useYouTubeEvent(player, 'playbackRateChange', onPlaybackRateChange);

  // 재생 진행률 추적 (1초마다)
  const progress = useYouTubeEvent(player, 'progress', 1000);

  useEffect(() => {
    if (progress) {
      PlayerLogger.log('재생 진행:', {
        currentTime: progress.currentTime,
        duration: progress.duration,
        percentage: (progress.currentTime / progress.duration) * 100,
      });
      updateProgress(progress.currentTime, progress.duration);

      // GA4 로깅용 총 재생 시간 저장
      if (progress.duration > 0) {
        totalDurationRef.current = progress.duration;
      }
    }
  }, [progress, updateProgress]);

  // 페이지 이탈 시 시청 진행률 저장은 useWatchProgressSync 훅 내부에서 처리됨

  // 자동 재생 차단 감지
  useYouTubeEvent(player, 'autoplayBlocked', async () => {
    PlayerLogger.log('자동 재생이 차단되었습니다');
    if (Platform.OS === 'ios') {
      const result = await showDialog({
        title: '자동 재생 차단됨',
        description: '재생 버튼을 눌러 영상을 시작하세요',
        buttonText: '재생',
      });
      if (result === 'confirm') {
        player.play();
      }
    }
  });

  // 에러 이벤트
  useYouTubeEvent(player, 'error', handleError);

  // Fallback: YouTube 모바일 사이트를 WebView로 직접 로드
  if (isFallbackMode) {
    const mobileYouTubeUrl = `https://m.youtube.com/watch?v=${videoId}`;

    return (
      <BasePage
        backgroundColor={colors.black}
        statusBarStyle="light-content"
        touchableWithoutFeedback={false}
      >
        <BackButtonAppBar title={title} backgroundColor={colors.black} />
        <FallbackContainer>
          <WebView
            source={{ uri: mobileYouTubeUrl }}
            style={{ flex: 1, backgroundColor: colors.black }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            allowsBackForwardNavigationGestures={false}
            onError={async () => {
              const result = await showConfirmDialog({
                title: '재생 오류',
                description: 'YouTube 앱에서 재생합니다.',
                leftButtonText: '취소',
                rightButtonText: 'YouTube 열기',
              });
              if (result === 'left') {
                navigation.goBack();
              } else if (result === 'right') {
                await openInYouTube();
                navigation.goBack();
              }
            }}
          />
        </FallbackContainer>
      </BasePage>
    );
  }

  // Android 전체화면 모드
  if (isAndroid) {
    return (
      <FullscreenContainer style={{ paddingBottom: insets.bottom }}>
        {!isPlayerReady && (
          <LoadingContainer>
            <ActivityIndicator size="small" color={colors.white} />
          </LoadingContainer>
        )}
        <YoutubeView
          player={player}
          height={playerHeight - insets.bottom}
          width={playerWidth}
          style={{
            opacity: isPlayerReady ? 1 : 0,
            backgroundColor: colors.black,
          }}
          webViewStyle={{
            backgroundColor: colors.black,
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            allowsFullscreenVideo: true,
            mixedContentMode: 'always',
            domStorageEnabled: true,
          }}
          useInlineHtml={false}
        />
      </FullscreenContainer>
    );
  }

  // iOS 모드
  return (
    <BasePage
      backgroundColor={colors.black}
      statusBarStyle="light-content"
      touchableWithoutFeedback={false}
    >
      <BackButtonAppBar
        title={title}
        backgroundColor="rgba(0,0,0,0.8)"
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={999}
      />
      <Container>
        {!isPlayerReady && (
          <LoadingContainer>
            <ActivityIndicator size="small" color={colors.white} />
          </LoadingContainer>
        )}
        <YoutubeView
          player={player}
          height={playerHeight}
          width={playerWidth}
          style={{
            opacity: isPlayerReady ? 1 : 0,
            backgroundColor: colors.black,
          }}
          webViewStyle={{
            backgroundColor: colors.black,
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            allowsFullscreenVideo: true,
            mixedContentMode: 'always',
            domStorageEnabled: true,
          }}
          useInlineHtml={false}
        />
        <PlayerWatchProviderView contentId={contentId} contentType={contentType} />
        {__DEV__ && (
          <DebugInfo>
            <DebugText>
              플레이어: {playerWidth}x{Math.floor(playerHeight)}
            </DebugText>
            <DebugText>재생율: {currentPlaybackRate}x</DebugText>
            {progress && (
              <DebugText>
                진행: {Math.floor(progress.currentTime)}s / {Math.floor(progress.duration)}s
              </DebugText>
            )}
          </DebugInfo>
        )}
      </Container>
    </BasePage>
  );
};

/* Styled Components */
const FullscreenContainer = styled.View({
  flex: 1,
  backgroundColor: colors.black,
  justifyContent: 'center',
  alignItems: 'center',
});

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
  justifyContent: 'center',
  alignItems: 'center',
});

const FallbackContainer = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const LoadingContainer = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.black,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 998,
});

const DebugInfo = styled.View({
  position: 'absolute',
  bottom: 100,
  left: 20,
  backgroundColor: 'rgba(0,0,0,0.7)',
  padding: 10,
  borderRadius: 8,
});

const DebugText = styled.Text({
  color: colors.white,
  fontSize: 12,
  marginVertical: 2,
});
