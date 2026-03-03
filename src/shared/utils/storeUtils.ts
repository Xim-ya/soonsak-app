/**
 * storeUtils - 앱스토어/플레이스토어 관련 유틸리티
 *
 * 스토어 URL 열기, 리뷰 페이지 이동 등 스토어 관련 공통 기능을 제공합니다.
 *
 * @example
 * // 기본 사용 (서버 URL 없이)
 * await openStoreUrl();
 *
 * // 서버에서 받은 URL 사용
 * await openStoreUrl(policy.storeUrl);
 *
 * // 리뷰 작성 페이지로 이동 (iOS만 action=write-review 추가)
 * await openStoreUrl(policy.storeUrl, { forReview: true });
 */

import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

// 스토어 설정
const STORE_CONFIG = {
  iosAppId: '6758769228',
  androidPackageName: Constants.expoConfig?.android?.package ?? 'com.soonsak.app',
} as const;

interface OpenStoreUrlOptions {
  /** 리뷰 작성 페이지로 이동 (iOS: action=write-review 추가) */
  forReview?: boolean;
}

/**
 * 플랫폼별 기본 스토어 URL 생성
 */
function getDefaultStoreUrl(options?: OpenStoreUrlOptions): string {
  const forReview = options?.forReview ?? false;

  if (Platform.OS === 'ios') {
    const baseUrl = `https://apps.apple.com/app/id${STORE_CONFIG.iosAppId}`;
    return forReview ? `${baseUrl}?action=write-review` : baseUrl;
  }

  // Android는 market:// 스킴 사용
  return `market://details?id=${STORE_CONFIG.androidPackageName}`;
}

/**
 * Android Play Store 웹 URL (market:// 실패 시 폴백용)
 */
function getAndroidWebUrl(): string {
  return `https://play.google.com/store/apps/details?id=${STORE_CONFIG.androidPackageName}`;
}

/**
 * 스토어 URL 열기
 *
 * @param serverStoreUrl - 서버에서 받은 store_url (없으면 기본 URL 사용)
 * @param options - 추가 옵션 (forReview: 리뷰 작성 페이지로 이동)
 * @returns 성공 여부
 *
 * @example
 * // 기본 사용
 * await openStoreUrl();
 *
 * // 서버 URL 사용
 * await openStoreUrl(versionPolicy.storeUrl);
 *
 * // 리뷰 작성 페이지
 * await openStoreUrl(null, { forReview: true });
 */
export async function openStoreUrl(
  serverStoreUrl?: string | null,
  options?: OpenStoreUrlOptions,
): Promise<boolean> {
  try {
    // 서버 URL이 있으면 우선 사용
    if (serverStoreUrl) {
      await Linking.openURL(serverStoreUrl);
      return true;
    }

    // 서버 URL이 없으면 플랫폼별 기본 URL 사용
    const defaultUrl = getDefaultStoreUrl(options);

    if (Platform.OS === 'android') {
      // Android: market:// 먼저 시도, 실패 시 웹 URL로 폴백
      try {
        await Linking.openURL(defaultUrl);
        return true;
      } catch {
        await Linking.openURL(getAndroidWebUrl());
        return true;
      }
    }

    // iOS: 바로 열기
    await Linking.openURL(defaultUrl);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('[storeUtils] 스토어 열기 실패:', error);
    }
    return false;
  }
}

/**
 * 스토어 리뷰 페이지 열기 (openStoreUrl의 편의 함수)
 *
 * @param serverStoreUrl - 서버에서 받은 store_url
 */
export async function openStoreReviewPage(serverStoreUrl?: string | null): Promise<boolean> {
  return openStoreUrl(serverStoreUrl, { forReview: true });
}
