/**
 * App Config Feature
 *
 * 앱 버전 관리, 점검 모드, Feature Flag 등 앱 설정 관련 기능
 */

// Singleton Manager
export { appConfigManager } from './AppConfigManager';

// API
export { appConfigApi } from './api/appConfigApi';

// Hooks
export { useAppVersionCheck } from './hooks/useAppVersionCheck';
export { useAppVersionInfo, getAppVersion } from './hooks/useAppVersionInfo';

// Utils
export { compareVersions, isVersionLowerThan, isVersionAtLeast } from './utils/versionUtils';

// Types
export type {
  AppPlatform,
  UpdateStatus,
  AppVersionPolicy,
  AppVersionPolicyDto,
  MaintenanceMode,
  MaintenanceModeDto,
  VersionCheckResult,
} from './types';
