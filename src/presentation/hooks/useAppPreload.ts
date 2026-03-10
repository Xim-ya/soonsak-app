import { useEffect, useState, useRef } from 'react';
import { Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { contentApi } from '@/features/content/api';
import { formatter } from '@/core/utils/formatter';
import { ContentDto } from '@/features/content/types';
import { appConfigManager } from '@/features/app-config';
import { AppLogger } from '@/core/utils';

/** 배너 콘텐츠 프리로드 개수 */
const BANNER_PRELOAD_COUNT = 5;

/** Lottie 스플래시 애니메이션 시간 (ms) - 2.5초 */
const LOTTIE_SPLASH_DURATION_MS = 2500;

/** 프리로드 최대 대기 시간 (ms) - 5초, 이후 강제 완료 */
const PRELOAD_GUARD_TIMEOUT_MS = 5000;

// 네이티브 스플래시 화면 자동 숨김 방지
SplashScreen.preventAutoHideAsync().catch(() => {
  // 이미 숨겨진 경우 무시
});

/** 프리로드된 배너 데이터 캐시 (홈 화면에서 재사용) */
let preloadedBannerCache: ContentDto[] | null = null;

/**
 * 프리로드된 배너 데이터 조회
 * 홈 화면의 useTopBannerContents에서 사용
 */
export function getPreloadedBannerContents(): ContentDto[] | null {
  const cached = preloadedBannerCache;
  // 한 번 사용 후 캐시 클리어 (세션 중 재사용 방지)
  preloadedBannerCache = null;
  return cached;
}

/**
 * 앱 시작 시 Lottie 스플래시 + 리소스 프리로드 (병렬 실행)
 *
 * 성능 최적화:
 * 1. appConfigManager + 배너 콘텐츠 병렬 로드 (Promise.all)
 * 2. Lottie 타이머와 병렬 실행
 * 3. 이미지 프리페치도 병렬 처리 (Promise.allSettled)
 * 4. 실패 시에도 앱 진입 차단 안 함
 */
export function useAppPreload() {
  const [showLottieSplash, setShowLottieSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const preloadCompleteRef = useRef(false);
  const lottieCompleteRef = useRef(false);

  // 네이티브 스플래시 즉시 숨기기 (Lottie로 대체)
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // 프리로드 + Lottie 타이머 병렬 실행
  useEffect(() => {
    // 프리로드 완료 체크 및 상태 업데이트
    const checkAndFinish = () => {
      if (preloadCompleteRef.current && lottieCompleteRef.current) {
        setShowLottieSplash(false);
        setIsReady(true);
      }
    };

    // 프리로드 로직
    async function preloadResources() {
      try {
        // ⚡️ 최적화 1: appConfig + 배너 콘텐츠 병렬 로드
        const [, bannerContents] = await Promise.all([
          appConfigManager.initialize(),
          contentApi.getRandomBannerContents(BANNER_PRELOAD_COUNT),
        ]);

        // 캐시에 저장 (홈 화면에서 재사용)
        preloadedBannerCache = bannerContents;

        // 배너 backdrop 이미지 URL 수집
        const backdropUrls = bannerContents
          .filter((content) => content.backdropPath)
          .map((content) => formatter.prefixTmdbImgUrl(content.backdropPath!));

        // 한국어 로고 이미지 URL 수집
        const logoUrls = bannerContents
          .filter((content) => content.titleLogo && content.titleLogoLang === 'ko')
          .map((content) => formatter.prefixTmdbImgUrl(content.titleLogo!));

        const allImageUrls = [...backdropUrls, ...logoUrls];

        // ⚡️ 최적화 2: 이미지 프리페치 병렬 실행 (실패해도 계속 진행)
        await Promise.allSettled(allImageUrls.map((url) => Image.prefetch(url)));

        AppLogger.log(
          `배너 이미지 ${backdropUrls.length}개, 로고 ${logoUrls.length}개 프리로드 완료`,
        );
      } catch (error) {
        // 프리로드 실패해도 앱은 정상 실행
        AppLogger.warn('프리로드 중 오류 (무시됨):', error);
      } finally {
        preloadCompleteRef.current = true;
        checkAndFinish();
      }
    }

    // Lottie 타이머 (2.5초)
    const lottieTimer = setTimeout(() => {
      AppLogger.log('Lottie 애니메이션 완료');
      lottieCompleteRef.current = true;
      checkAndFinish();
    }, LOTTIE_SPLASH_DURATION_MS);

    // 프리로드 guard timeout (무한 대기 방지)
    const guardTimer = setTimeout(() => {
      if (!preloadCompleteRef.current) {
        AppLogger.warn('프리로드 타임아웃 - 강제 완료 처리');
        preloadCompleteRef.current = true;
        checkAndFinish();
      }
    }, PRELOAD_GUARD_TIMEOUT_MS);

    // 프리로드 시작
    preloadResources();

    return () => {
      clearTimeout(lottieTimer);
      clearTimeout(guardTimer);
    };
  }, []);

  return { isReady, showLottieSplash };
}
