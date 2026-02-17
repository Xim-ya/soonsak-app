import { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Platform, Alert } from 'react-native';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent } from 'react-native-youtube-bridge';
import WebView from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { useWatchProgressSync } from '@/features/watch-history';
import { AppSize } from '@/shared/utils/appSize';
import { PlayerWatchProviderView } from './_components/PlayerWatchProviderView';
import { usePlayerReady, useResumePlayback, useFallbackPlayer } from './_hooks';

type PlayerPageRouteProp = RouteProp<RootStackParamList, typeof routePages.player>;

/**
 * YouTube 영상 재생 페이지
 * react-native-youtube-bridge를 사용하여 YouTube 영상을 재생합니다.
 * 임베드 제한(에러 150/152/153) 발생 시 YouTube 모바일 사이트로 fallback합니다.
 */
export const PlayerPage = () => {
  const route = useRoute<PlayerPageRouteProp>();
  const navigation = useNavigation();
  const { videoId, title, contentId, contentType, startSeconds } = route.params;
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);

  const screenWidth = AppSize.screenWidth;

  // iOS 전체화면 회전 복구: 페이지 진입/이탈 시 portrait 잠금
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
          // 방향 잠금 실패 시 무시 (앱 동작에 영향 없음)
        });
      }
      return () => {
        if (Platform.OS === 'ios') {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
            .then(() => {
              AppSize.forceRefreshDimensions();
            })
            .catch(() => {
              // 방향 잠금 실패해도 dimensions 갱신 시도
              AppSize.forceRefreshDimensions();
            });
        }
      };
    }, []),
  );

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
  useYouTubeEvent(player, 'autoplayBlocked', () => {
    console.log('자동 재생이 차단되었습니다');
    if (Platform.OS === 'ios') {
      Alert.alert('자동 재생 차단됨', '재생 버튼을 눌러 영상을 시작하세요', [
        {
          text: '재생',
          onPress: () => player.play(),
        },
      ]);
    }
  });

  // 에러 이벤트
  useYouTubeEvent(player, 'error', handleError);

  // 16:9 비율로 계산된 높이
  const playerWidth = screenWidth;
  const playerHeight = (playerWidth * 9) / 16;

  // Fallback: YouTube 모바일 사이트를 WebView로 직접 로드
  if (isFallbackMode) {
    const mobileYouTubeUrl = `https://m.youtube.com/watch?v=${videoId}`;

    return (
      <BasePage backgroundColor={colors.black} statusBarStyle="light-content">
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
            onError={() => {
              Alert.alert('재생 오류', 'YouTube 앱에서 재생합니다.', [
                {
                  text: '취소',
                  style: 'cancel',
                  onPress: () => navigation.goBack(),
                },
                {
                  text: 'YouTube 열기',
                  onPress: async () => {
                    await openInYouTube();
                    navigation.goBack();
                  },
                },
              ]);
            }}
          />
        </FallbackContainer>
      </BasePage>
    );
  }

  return (
    <BasePage backgroundColor={colors.black} statusBarStyle="light-content">
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
