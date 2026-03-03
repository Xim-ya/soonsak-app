import { useEffect, useState, useRef } from 'react';
import { Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { contentApi } from '@/features/content/api/contentApi';
import { formatter } from '@/shared/utils/formatter';
import { ContentDto } from '@/features/content/types';
import { appConfigManager } from '@/features/app-config';

/** 배너 콘텐츠 프리로드 개수 */
const BANNER_PRELOAD_COUNT = 5;

/** Lottie 스플래시 애니메이션 시간 (ms) - 2.5초 */
const LOTTIE_SPLASH_DURATION_MS = 2500;

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
 * 앱 시작 시 Lottie 스플래시 + 배너 이미지 프리로드 (병렬 실행)
 *
 * 1. 네이티브 스플래시 즉시 숨김
 * 2. Lottie 2.5초 재생 + 프리로드 병렬 실행
 * 3. 둘 다 완료되면 isReady = true
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
        // appConfigManager 초기화 (버전 정책, 점검 모드 등)
        await appConfigManager.initialize();

        const bannerContents = await contentApi.getRandomBannerContents(BANNER_PRELOAD_COUNT);

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

        // 이미지 프리페치 (실패해도 계속 진행)
        await Promise.allSettled(allImageUrls.map((url) => Image.prefetch(url)));

        console.log(
          `[Preload] 배너 이미지 ${backdropUrls.length}개, 로고 ${logoUrls.length}개 프리로드 완료`,
        );
      } catch (error) {
        // 프리로드 실패해도 앱은 정상 실행
        console.warn('[Preload] 프리로드 중 오류 (무시됨):', error);
      } finally {
        preloadCompleteRef.current = true;
        checkAndFinish();
      }
    }

    // Lottie 타이머 (2.5초)
    const lottieTimer = setTimeout(() => {
      console.log('[Preload] Lottie 애니메이션 완료');
      lottieCompleteRef.current = true;
      checkAndFinish();
    }, LOTTIE_SPLASH_DURATION_MS);

    // 프리로드 시작
    preloadResources();

    return () => {
      clearTimeout(lottieTimer);
    };
  }, []);

  return { isReady, showLottieSplash };
}
