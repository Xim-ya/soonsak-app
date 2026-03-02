/**
 * usePlayVideo - 비디오 재생 훅
 *
 * 심사 버전 여부에 따라 재생 방식을 결정합니다:
 * - 심사 버전: YouTube 앱으로 직접 이동 (앱 내 플레이어/웹뷰 사용 안함)
 * - 일반 버전: PlayerScreen으로 이동
 *
 * @example
 * const { playVideo } = usePlayVideo();
 *
 * // 재생 버튼 클릭 시
 * playVideo({
 *   videoId: 'abc123',
 *   title: '영상 제목',
 *   contentId: 1,
 *   contentType: 'movie',
 * });
 */

import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { appConfigManager } from '@/features/app-config';
import { ContentType } from '@/shared/types/content/contentType.enum';
import { buildYouTubeUrl } from '../utils/urlParser';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PlayVideoParams {
  /** YouTube 비디오 ID */
  videoId: string;
  /** 영상 제목 */
  title: string;
  /** 콘텐츠 ID */
  contentId: number;
  /** 콘텐츠 타입 */
  contentType: ContentType;
  /** 이어보기 시작 시간 (초) */
  startSeconds?: number;
}

interface UsePlayVideoResult {
  /** 비디오 재생 함수 */
  playVideo: (params: PlayVideoParams) => Promise<void>;
  /** 심사 버전 여부 */
  isReviewVersion: boolean;
}

export function usePlayVideo(): UsePlayVideoResult {
  const navigation = useNavigation<NavigationProp>();
  const isReviewVersion = appConfigManager.isReviewVersion();

  const playVideo = useCallback(
    async (params: PlayVideoParams) => {
      const { videoId, title, contentId, contentType, startSeconds } = params;

      // 심사 버전이면 YouTube 웹 URL로 외부 앱 열기
      // iOS Universal Links로 YouTube 앱이 설치되어 있으면 자동으로 앱에서 열림
      if (isReviewVersion) {
        console.log('[usePlayVideo] 심사 버전 감지 → YouTube로 이동');

        const youtubeUrl = buildYouTubeUrl(videoId);

        try {
          await Linking.openURL(youtubeUrl);
        } catch (error) {
          console.error('[usePlayVideo] YouTube 열기 실패:', error);
        }
        return;
      }

      // 일반 버전은 PlayerScreen으로 이동
      navigation.navigate(routePages.player, {
        videoId,
        title,
        contentId,
        contentType,
        ...(startSeconds != null && { startSeconds }),
      });
    },
    [navigation, isReviewVersion],
  );

  return {
    playVideo,
    isReviewVersion,
  };
}
