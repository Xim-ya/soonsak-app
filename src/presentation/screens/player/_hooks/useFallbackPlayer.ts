/**
 * useFallbackPlayer - Fallback 플레이어 로직
 *
 * 역할:
 * - fallback 상태 관리
 * - 에러 처리 및 fallback 전환 판단
 * - YouTube 앱/브라우저로 열기 함수 제공
 */

import { useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { buildYouTubeUrl, buildYouTubeAppUrl, isEmbeddedRestrictedError } from '@/features/youtube';
import { useDialog } from '@/presentation/components/dialog';

interface UseFallbackPlayerParams {
  readonly videoId: string;
}

interface FallbackPlayerResult {
  readonly isFallbackMode: boolean;
  /** 에러 핸들러 - useYouTubeEvent에 전달 */
  readonly handleError: (error: { code: number; message: string }) => void;
  /** YouTube 앱 또는 브라우저에서 열기 */
  readonly openInYouTube: () => Promise<void>;
}

export function useFallbackPlayer({ videoId }: UseFallbackPlayerParams): FallbackPlayerResult {
  const navigation = useNavigation();
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const { showDialog } = useDialog();

  const openInYouTube = useCallback(async () => {
    const youtubeUrl = buildYouTubeUrl(videoId);
    const youtubeAppUrl = buildYouTubeAppUrl(videoId);

    try {
      const canOpenYouTubeApp = await Linking.canOpenURL(youtubeAppUrl);
      if (canOpenYouTubeApp) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(youtubeUrl);
      }
    } catch (linkingError) {
      console.error('링크 열기 실패:', linkingError);
      await showDialog({
        title: '오류',
        description: 'YouTube로 연결할 수 없습니다.',
        buttonText: '확인',
      });
    }
  }, [videoId, showDialog]);

  const handleError = useCallback(
    async (error: { code: number; message: string }) => {
      console.error('플레이어 에러:', error);

      const isEmbedRestricted = isEmbeddedRestrictedError(error);

      if (isEmbedRestricted) {
        console.log('임베드 제한 감지 → YouTube 모바일 사이트 fallback 전환');
        setIsFallbackMode(true);
      } else {
        const result = await showDialog({
          title: '재생 오류',
          description: `에러 코드: ${error.code}\n${error.message}`,
          buttonText: '확인',
        });
        if (result === 'confirm') {
          navigation.goBack();
        }
      }
    },
    [navigation, showDialog],
  );

  return {
    isFallbackMode,
    handleError,
    openInYouTube,
  };
}
