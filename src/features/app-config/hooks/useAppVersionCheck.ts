/**
 * useAppVersionCheck - 앱 버전 체크 훅
 *
 * 앱 시작 시 버전을 체크하고 업데이트 다이얼로그를 표시합니다.
 * - 강제 업데이트: 앱 사용 불가, 스토어로 이동 필수
 * - 권장 업데이트: 닫기 가능, 버전당 1회만 표시
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfigApi } from '../api/appConfigApi';
import { isVersionLowerThan } from '../utils/versionUtils';
import type { UpdateStatus, AppVersionPolicy, VersionCheckResult } from '../types';
import { VersionLogger } from '@/shared/utils/logger';

/** AsyncStorage 키 */
const DISMISSED_VERSION_KEY = '@app_config/dismissed_soft_update_version';

/**
 * 현재 앱 버전 가져오기
 */
function getAppVersion(): string {
  // expo-application에서 버전 가져오기
  const version = Application.nativeApplicationVersion;
  return version ?? '1.0.0';
}

/**
 * 권장 업데이트 dismissed 버전 저장
 */
async function saveDismissedVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch (error) {
    VersionLogger.error('dismissed 버전 저장 실패:', error);
  }
}

/**
 * 권장 업데이트 dismissed 버전 조회
 */
async function getDismissedVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
  } catch (error) {
    VersionLogger.error('dismissed 버전 조회 실패:', error);
    return null;
  }
}

/**
 * 버전 체크 결과 계산
 */
function calculateVersionCheckResult(
  currentVersion: string,
  policy: AppVersionPolicy,
): VersionCheckResult {
  // 심사 버전인 경우 업데이트 체크 스킵
  if (policy.reviewVersion && currentVersion === policy.reviewVersion) {
    return {
      status: 'none',
      title: '',
      message: '',
      storeUrl: policy.storeUrl,
      targetVersion: policy.latestVersion,
    };
  }

  // 강제 업데이트 체크 (현재 버전 < 최소 버전)
  if (isVersionLowerThan(currentVersion, policy.minimumVersion)) {
    return {
      status: 'force',
      title: policy.forceUpdateTitle,
      message: policy.forceUpdateMessage,
      storeUrl: policy.storeUrl,
      targetVersion: policy.minimumVersion,
    };
  }

  // 권장 업데이트 체크 (현재 버전 < 권장 버전)
  if (isVersionLowerThan(currentVersion, policy.recommendedVersion)) {
    return {
      status: 'recommended',
      title: policy.softUpdateTitle,
      message: policy.softUpdateMessage,
      storeUrl: policy.storeUrl,
      targetVersion: policy.recommendedVersion,
    };
  }

  return {
    status: 'none',
    title: '',
    message: '',
    storeUrl: policy.storeUrl,
    targetVersion: policy.latestVersion,
  };
}

interface UseAppVersionCheckOptions {
  /** 버전 체크 활성화 여부 (기본: true) */
  enabled?: boolean;
}

interface UseAppVersionCheckReturn {
  /** 버전 체크 완료 여부 */
  isChecked: boolean;
  /** 업데이트 상태 */
  updateStatus: UpdateStatus;
  /** 다이얼로그 표시 여부 */
  showDialog: boolean;
  /** 다이얼로그 제목 */
  dialogTitle: string;
  /** 다이얼로그 메시지 */
  dialogMessage: string;
  /** 강제 업데이트 여부 */
  isForceUpdate: boolean;
  /** 스토어로 이동 */
  openStore: () => void;
  /** 다이얼로그 닫기 (권장 업데이트만) */
  dismissDialog: () => void;
}

export function useAppVersionCheck(
  options: UseAppVersionCheckOptions = {},
): UseAppVersionCheckReturn {
  const { enabled = true } = options;

  const [isChecked, setIsChecked] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('none');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const storeUrlRef = useRef<string | null>(null);
  const targetVersionRef = useRef<string>('');

  // 스토어 열기
  const openStore = useCallback(() => {
    const storeUrl = storeUrlRef.current;
    if (storeUrl) {
      Linking.openURL(storeUrl).catch((error) => {
        VersionLogger.error('스토어 열기 실패:', error);
      });
    } else {
      // 기본 스토어 URL
      const defaultUrl =
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/id6758769228'
          : 'https://play.google.com/store/apps/details?id=com.soonsak.app';
      Linking.openURL(defaultUrl);
    }
  }, []);

  // 다이얼로그 닫기 (권장 업데이트)
  const dismissDialog = useCallback(async () => {
    setShowDialog(false);
    // dismissed 버전 저장
    if (targetVersionRef.current) {
      await saveDismissedVersion(targetVersionRef.current);
    }
  }, []);

  // 버전 체크 실행
  useEffect(() => {
    if (!enabled) {
      setIsChecked(true);
      return;
    }

    async function checkVersion() {
      try {
        const currentVersion = getAppVersion();

        VersionLogger.log('현재 버전:', currentVersion);

        // 서버에서 버전 정책 조회
        const policy = await appConfigApi.getVersionPolicy();

        if (!policy) {
          VersionLogger.log('버전 정책 없음, 체크 스킵');
          setIsChecked(true);
          return;
        }

        VersionLogger.log('버전 정책:', policy);

        // 버전 체크 결과 계산
        const result = calculateVersionCheckResult(currentVersion, policy);
        setUpdateStatus(result.status);
        storeUrlRef.current = result.storeUrl;
        targetVersionRef.current = result.targetVersion;

        if (result.status === 'none') {
          setIsChecked(true);
          return;
        }

        // 강제 업데이트
        if (result.status === 'force') {
          setDialogTitle(result.title);
          setDialogMessage(result.message);
          setShowDialog(true);
          setIsChecked(true);
          return;
        }

        // 권장 업데이트 - dismissed 버전 체크
        if (result.status === 'recommended') {
          const dismissedVersion = await getDismissedVersion();

          // 이미 이 버전에서 닫기를 누른 경우 스킵
          if (dismissedVersion === result.targetVersion) {
            VersionLogger.log('권장 업데이트 이미 dismissed:', dismissedVersion);
            setIsChecked(true);
            return;
          }

          setDialogTitle(result.title);
          setDialogMessage(result.message);
          setShowDialog(true);
          setIsChecked(true);
        }
      } catch (error) {
        VersionLogger.error('버전 체크 실패:', error);
        // 에러 발생 시에도 앱은 정상 실행
        setIsChecked(true);
      }
    }

    checkVersion();
  }, [enabled]);

  return {
    isChecked,
    updateStatus,
    showDialog,
    dialogTitle,
    dialogMessage,
    isForceUpdate: updateStatus === 'force',
    openStore,
    dismissDialog,
  };
}
