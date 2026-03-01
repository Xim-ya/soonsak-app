/**
 * useScreenOrientation - 플레이어 화면 방향 관리 훅
 *
 * Android: 가로 모드 전체화면
 * iOS: 세로 모드 유지
 *
 * 페이지 이탈 시 자동으로 세로 모드로 복구합니다.
 *
 * @example
 * const { screenDimensions, playerWidth, playerHeight, isAndroid } = useScreenOrientation();
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, StatusBar, Dimensions, ScaledSize } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AppSize } from '@/shared/utils/appSize';

interface UseScreenOrientationReturn {
  /** 현재 화면 크기 */
  screenDimensions: ScaledSize;
  /** 플레이어 너비 */
  playerWidth: number;
  /** 플레이어 높이 (Android: 전체화면, iOS: 16:9 비율) */
  playerHeight: number;
  /** Android 플랫폼 여부 */
  isAndroid: boolean;
}

export function useScreenOrientation(): UseScreenOrientationReturn {
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const isAndroid = Platform.OS === 'android';

  // 화면 회전 시 dimensions 업데이트
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Android: 가로 모드 강제 전체화면 / iOS: portrait 유지
  useFocusEffect(
    useCallback(() => {
      if (isAndroid) {
        // Android: 가로 모드 + 상태바 숨김
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
        StatusBar.setHidden(true);
      } else {
        // iOS: portrait 유지
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }

      return () => {
        // 페이지 이탈 시 portrait 복구
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
          .catch(() => {})
          .finally(() => {
            AppSize.forceRefreshDimensions();
          });
        if (isAndroid) {
          StatusBar.setHidden(false);
        }
      };
    }, [isAndroid]),
  );

  // 플레이어 크기 계산
  const playerWidth = screenDimensions.width;
  const playerHeight = isAndroid ? screenDimensions.height : (screenDimensions.width * 9) / 16;

  return {
    screenDimensions,
    playerWidth,
    playerHeight,
    isAndroid,
  };
}
