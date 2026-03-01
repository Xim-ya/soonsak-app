import { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Platform } from 'react-native';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent } from 'react-native-youtube-bridge';
import WebView from 'react-native-webview';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { useWatchProgressSync } from '@/features/watch-history';
import { PlayerWatchProviderView } from './_components/PlayerWatchProviderView';
import { usePlayerReady, useResumePlayback, useFallbackPlayer, useScreenOrientation } from './_hooks';
import { useDialog } from '@/presentation/components/dialog';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, typeof routePages.player>;

/**
 * YouTube 영상 재생 페이지
 * react-native-youtube-bridge를 사용하여 YouTube 영상을 재생합니다.
 * 임베드 제한(에러 150/152/153) 발생 시 YouTube 모바일 사이트로 fallback합니다.
 */
export const PlayerScreen = () => {
  const route = useRoute<PlayerScreenRouteProp>();
  const navigation = useNavigation();
  const { videoId, title, contentId, contentType, startSeconds } = route.params;
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);
  const { showDialog, showConfirmDialog } = useDialog();

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
  });

  // 플레이어 준비 완료 이벤트
  useYouTubeEvent(player, 'ready', handleReady);

  // 재생 상태 변경 이벤트
  useYouTubeEvent(player, 'stateChange', (state) => {
    console.log('재생 상태 변경:', state);

    const stateValue = typeof state === 'number' ? state : (state as { state: number }).state;

    handleResumeOnStateChange(stateValue);
    handleStateChange(stateValue);
  });

  // 재생율 변경 이벤트
  const onPlaybackRateChange = useCallback((rate: number) => {
    console.log('재생율 변경됨:', rate);
    setCurrentPlaybackRate(rate);

    if (rate !== 1) {
      console.log(`재생 속도가 ${rate}배로 변경되었습니다`);
    }
  }, []);

  useYouTubeEvent(player, 'playbackRateChange', onPlaybackRateChange);

  // 재생 진행률 추적 (1초마다)
  const progress = useYouTubeEvent(player, 'progress', 1000);

  useEffect(() => {
    if (progress) {
      console.log('재생 진행:', {
        currentTime: progress.currentTime,
        duration: progress.duration,
        percentage: (progress.currentTime / progress.duration) * 100,
      });
      updateProgress(progress.currentTime, progress.duration);
    }
  }, [progress, updateProgress]);

  // 페이지 이탈 시 시청 진행률 저장은 useWatchProgressSync 훅 내부에서 처리됨

  // 자동 재생 차단 감지
  useYouTubeEvent(player, 'autoplayBlocked', async () => {
    console.log('자동 재생이 차단되었습니다');
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
      <FullscreenContainer>
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
