/**
 * appConfigApi - 앱 설정 API
 *
 * 버전 정책, 점검 모드 등 앱 설정을 조회합니다.
 */

import { Platform } from 'react-native';
import { supabaseClient } from '@/shared/api/supabaseClient';
import type {
  AppPlatform,
  AppVersionPolicy,
  AppVersionPolicyDto,
  MaintenanceMode,
  MaintenanceModeDto,
} from '../types';
import { Logger } from '@/shared/utils/logger';

const AppConfigLogger = Logger.create('AppConfig');

/** 현재 플랫폼 */
const currentPlatform: AppPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

/**
 * DTO → 모델 변환
 */
function toVersionPolicy(dto: AppVersionPolicyDto): AppVersionPolicy {
  return {
    platform: dto.platform,
    latestVersion: dto.latest_version,
    minimumVersion: dto.minimum_version,
    recommendedVersion: dto.recommended_version,
    reviewVersion: dto.review_version,
    storeUrl: dto.store_url,
    forceUpdateTitle: dto.force_update_title,
    forceUpdateMessage: dto.force_update_message,
    softUpdateTitle: dto.soft_update_title,
    softUpdateMessage: dto.soft_update_message,
  };
}

function toMaintenanceMode(dto: MaintenanceModeDto): MaintenanceMode {
  return {
    enabled: dto.enabled,
    title: dto.title,
    message: dto.message,
    estimatedEndTime: dto.estimated_end_time,
    allowedVersions: dto.allowed_versions ?? [],
  };
}

export const appConfigApi = {
  /**
   * 현재 플랫폼의 버전 정책 조회
   */
  getVersionPolicy: async (): Promise<AppVersionPolicy | null> => {
    const { data, error } = await supabaseClient
      .from('app_version_policy')
      .select('*')
      .eq('platform', currentPlatform)
      .single();

    if (error) {
      AppConfigLogger.error('버전 정책 조회 실패:', error);
      return null;
    }

    return toVersionPolicy(data as AppVersionPolicyDto);
  },

  /**
   * 점검 모드 상태 조회
   */
  getMaintenanceMode: async (): Promise<MaintenanceMode | null> => {
    const { data, error } = await supabaseClient
      .from('maintenance_mode')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      AppConfigLogger.error('점검 모드 조회 실패:', error);
      return null;
    }

    return toMaintenanceMode(data as MaintenanceModeDto);
  },

  /**
   * 버전 정책 + 점검 모드 동시 조회
   */
  getAppConfig: async (): Promise<{
    versionPolicy: AppVersionPolicy | null;
    maintenanceMode: MaintenanceMode | null;
  }> => {
    const [versionPolicy, maintenanceMode] = await Promise.all([
      appConfigApi.getVersionPolicy(),
      appConfigApi.getMaintenanceMode(),
    ]);

    return { versionPolicy, maintenanceMode };
  },
};
