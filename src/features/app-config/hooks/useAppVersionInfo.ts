/**
 * useAppVersionInfo - 앱 버전 정보 훅
 *
 * 설정 화면 등에서 현재 버전과 업데이트 가능 여부를 표시할 때 사용합니다.
 */

import { useEffect, useState, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import { appConfigApi } from '../api/appConfigApi';
import { isVersionLowerThan } from '../utils/versionUtils';

/** 개발 모드 여부 */
const isDev = __DEV__;

/**
 * 현재 앱 버전 가져오기
 */
export function getAppVersion(): string {
  const version = Application.nativeApplicationVersion;
  return version ?? '1.0.0';
}

interface UseAppVersionInfoReturn {
  /** 현재 앱 버전 */
  currentVersion: string;
  /** 최신 버전 (서버) */
  latestVersion: string | null;
  /** 업데이트 가능 여부 */
  hasUpdate: boolean;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 스토어로 이동 */
  openStore: () => void;
}

export function useAppVersionInfo(): UseAppVersionInfoReturn {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentVersion = getAppVersion();

  // 스토어 열기
  const openStore = useCallback(() => {
    const url =
      storeUrl ??
      (Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6758769228'
        : 'https://play.google.com/store/apps/details?id=com.soonsak.app');

    Linking.openURL(url).catch((error) => {
      if (isDev) {
        console.error('[useAppVersionInfo] 스토어 열기 실패:', error);
      }
    });
  }, [storeUrl]);

  // 버전 정보 조회
  useEffect(() => {
    async function fetchVersionInfo() {
      try {
        const policy = await appConfigApi.getVersionPolicy();

        if (policy) {
          setLatestVersion(policy.latestVersion);
          setStoreUrl(policy.storeUrl);
        }
      } catch (error) {
        if (isDev) {
          console.error('[useAppVersionInfo] 버전 정보 조회 실패:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersionInfo();
  }, []);

  // 업데이트 가능 여부 계산
  const hasUpdate = latestVersion ? isVersionLowerThan(currentVersion, latestVersion) : false;

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    isLoading,
    openStore,
  };
}
