import { useEffect, useState, useCallback, useRef } from 'react';
import { Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { contentApi } from '@/features/content/api/contentApi';
import { formatter } from '@/shared/utils/formatter';
import { ContentDto } from '@/features/content/types';

/** 배너 콘텐츠 프리로드 개수 */
const BANNER_PRELOAD_COUNT = 5;

/** 프리로드 최대 대기 시간 (ms) */
const PRELOAD_TIMEOUT_MS = 2000;

// 스플래시 화면 자동 숨김 방지
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
 * 앱 시작 시 배너 이미지 프리로드 (최대 2초 대기)
 */
export function useAppPreload() {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);

  useEffect(() => {
    async function preloadResources() {
      try {
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
      }
    }

    // 타임아웃과 프리로드 경쟁
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('[Preload] 타임아웃 - 앱 시작');
        resolve();
      }, PRELOAD_TIMEOUT_MS);
    });

    Promise.race([preloadResources(), timeoutPromise]).finally(() => {
      isReadyRef.current = true;
      setIsReady(true);
    });
  }, []);

  // 스플래시 숨기기 콜백 (안정적인 참조 - deps 없음)
  const hideSplash = useCallback(async () => {
    if (isReadyRef.current) {
      await SplashScreen.hideAsync();
    }
  }, []);

  return { isReady, hideSplash };
}
