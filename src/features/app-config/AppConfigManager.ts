/**
 * AppConfigManager - 앱 설정 싱글톤 매니저
 *
 * 앱 시작 시 1회 초기화되어 전역에서 접근 가능한 설정 관리자입니다.
 * - 심사 버전 여부 체크
 * - Feature Flag 체크
 * - 점검 모드 체크
 * - 버전 정보 조회
 *
 * @example
 * // 앱 시작 시 초기화 (App.tsx)
 * await AppConfigManager.initialize();
 *
 * // 어디서든 사용
 * if (AppConfigManager.isReviewVersion()) {
 *   // 심사 버전 전용 로직
 * }
 */

import * as Application from 'expo-application';
import { appConfigApi } from './api/appConfigApi';
import { isVersionLowerThan } from './utils/versionUtils';
import type { AppVersionPolicy, MaintenanceMode } from './types';
import { Logger } from '@/core/utils';

const AppConfigLogger = Logger.create('AppConfig');

class AppConfigManager {
  /** 초기화 완료 여부 */
  private initialized = false;

  /** 현재 앱 버전 */
  private currentVersion: string = '';

  /** 버전 정책 (서버에서 가져온 값) */
  private versionPolicy: AppVersionPolicy | null = null;

  /** 점검 모드 상태 */
  private maintenanceMode: MaintenanceMode | null = null;

  /**
   * 앱 설정 초기화
   * 앱 시작 시 1회 호출해야 합니다.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      AppConfigLogger.log('이미 초기화됨');
      return;
    }

    try {
      // 현재 앱 버전
      this.currentVersion = Application.nativeApplicationVersion ?? '1.0.0';

      // 서버에서 설정 조회
      const { versionPolicy, maintenanceMode } = await appConfigApi.getAppConfig();
      this.versionPolicy = versionPolicy;
      this.maintenanceMode = maintenanceMode;

      this.initialized = true;

      AppConfigLogger.log('초기화 완료:', {
        currentVersion: this.currentVersion,
        reviewVersion: versionPolicy?.reviewVersion,
        isReviewVersion: this.isReviewVersion(),
      });
    } catch (error) {
      AppConfigLogger.error('초기화 실패:', error);
      // 초기화 실패해도 앱은 정상 실행되도록 함
      this.initialized = true;
    }
  }

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================================================
  // 버전 관련
  // ============================================================================

  /**
   * 현재 앱 버전 조회
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * 최신 버전 조회
   */
  getLatestVersion(): string | null {
    return this.versionPolicy?.latestVersion ?? null;
  }

  /**
   * 심사(리뷰) 버전 여부 확인
   * 현재 버전이 서버에 설정된 review_version과 일치하면 true
   */
  isReviewVersion(): boolean {
    if (!this.versionPolicy?.reviewVersion) {
      return false;
    }
    return this.currentVersion === this.versionPolicy.reviewVersion;
  }

  /**
   * 업데이트 필요 여부 (강제)
   */
  isForceUpdateRequired(): boolean {
    if (!this.versionPolicy) return false;
    return isVersionLowerThan(this.currentVersion, this.versionPolicy.minimumVersion);
  }

  /**
   * 업데이트 권장 여부
   */
  isUpdateRecommended(): boolean {
    if (!this.versionPolicy) return false;
    if (this.isForceUpdateRequired()) return false;
    return isVersionLowerThan(this.currentVersion, this.versionPolicy.recommendedVersion);
  }

  /**
   * 업데이트 가능 여부 (최신 버전보다 낮은 경우)
   */
  hasUpdate(): boolean {
    if (!this.versionPolicy) return false;
    return isVersionLowerThan(this.currentVersion, this.versionPolicy.latestVersion);
  }

  /**
   * 스토어 URL 조회
   */
  getStoreUrl(): string | null {
    return this.versionPolicy?.storeUrl ?? null;
  }

  // ============================================================================
  // 점검 모드 관련
  // ============================================================================

  /**
   * 점검 모드 여부 확인
   */
  isMaintenanceMode(): boolean {
    if (!this.maintenanceMode) return false;

    // 심사 버전은 점검 모드에서 제외
    if (this.isReviewVersion()) {
      return false;
    }

    // 허용된 버전인지 확인
    const allowedVersions = this.maintenanceMode.allowedVersions ?? [];
    const isAllowed = allowedVersions.some((v) => v.version === this.currentVersion);
    if (isAllowed) {
      return false;
    }

    return this.maintenanceMode.enabled;
  }

  /**
   * 점검 모드 정보 조회
   */
  getMaintenanceInfo(): { title: string; message: string; estimatedEndTime: string | null } | null {
    if (!this.maintenanceMode?.enabled) return null;
    return {
      title: this.maintenanceMode.title,
      message: this.maintenanceMode.message,
      estimatedEndTime: this.maintenanceMode.estimatedEndTime,
    };
  }

  // ============================================================================
  // 버전 정책 전체 조회
  // ============================================================================

  /**
   * 버전 정책 전체 조회
   */
  getVersionPolicy(): AppVersionPolicy | null {
    return this.versionPolicy;
  }

  // ============================================================================
  // 설정 리로드
  // ============================================================================

  /**
   * 서버에서 설정 다시 조회
   */
  async reload(): Promise<void> {
    try {
      const { versionPolicy, maintenanceMode } = await appConfigApi.getAppConfig();
      this.versionPolicy = versionPolicy;
      this.maintenanceMode = maintenanceMode;

      AppConfigLogger.log('리로드 완료');
    } catch (error) {
      AppConfigLogger.error('리로드 실패:', error);
    }
  }

  /**
   * 초기화 상태 리셋 (테스트용)
   */
  reset(): void {
    this.initialized = false;
    this.currentVersion = '';
    this.versionPolicy = null;
    this.maintenanceMode = null;
  }
}

/** 싱글톤 인스턴스 */
export const appConfigManager = new AppConfigManager();
