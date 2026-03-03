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
import {
  buildYouTubeUrl,
  buildYouTubeAppUrl,
  isEmbeddedRestrictedError,
  isVideoNeedsReviewError,
} from '@/features/youtube';
import { useDialog } from '@/presentation/components/dialog';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { analyticsService } from '@/shared/analytics';

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

      // GA4 플레이어 에러 로깅
      analyticsService.playerError({
        video_id: videoId,
        error_code: error.code,
        fallback_used: isEmbedRestricted,
      });

      // 비디오 상태를 needs_review로 변경해야 하는 에러인지 확인 (2, 5, 100, 101)
      if (isVideoNeedsReviewError(error.code)) {
        console.log(`에러 코드 ${error.code} 감지 → 비디오 상태를 needs_review로 변경`);
        try {
          const { error: updateError } = await supabaseClient
            .from('videos')
            .update({ status: 'needs_review' })
            .eq('id', videoId);

          if (updateError) {
            console.error('비디오 상태 업데이트 실패:', updateError);
          } else {
            console.log(`비디오 ${videoId} 상태를 needs_review로 변경 완료`);
          }
        } catch (err) {
          console.error('비디오 상태 업데이트 중 예외 발생:', err);
        }
      }

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
    [navigation, showDialog, videoId],
  );

  return {
    isFallbackMode,
    handleError,
    openInYouTube,
  };
}
