/**
 * App Config Types
 *
 * 앱 설정 관련 타입 정의
 */

/** 플랫폼 타입 */
export type AppPlatform = 'ios' | 'android';

/** 업데이트 상태 */
export type UpdateStatus = 'none' | 'recommended' | 'force';

/** 버전 정책 DTO (Supabase 응답) */
export interface AppVersionPolicyDto {
  id: string;
  platform: AppPlatform;
  latest_version: string;
  minimum_version: string;
  recommended_version: string;
  review_version: string | null;
  store_url: string | null;
  force_update_title: string;
  force_update_message: string;
  soft_update_title: string;
  soft_update_message: string;
  created_at: string;
  updated_at: string;
}

/** 버전 정책 모델 (앱에서 사용) */
export interface AppVersionPolicy {
  platform: AppPlatform;
  latestVersion: string;
  minimumVersion: string;
  recommendedVersion: string;
  reviewVersion: string | null;
  storeUrl: string | null;
  forceUpdateTitle: string;
  forceUpdateMessage: string;
  softUpdateTitle: string;
  softUpdateMessage: string;
}

/** 버전 체크 결과 */
export interface VersionCheckResult {
  status: UpdateStatus;
  title: string;
  message: string;
  storeUrl: string | null;
  targetVersion: string;
}

/** 점검 모드 DTO */
export interface MaintenanceModeDto {
  id: string;
  enabled: boolean;
  title: string;
  message: string;
  start_time: string | null;
  estimated_end_time: string | null;
  allowed_versions: Array<{ platform: AppPlatform; version: string }>;
  created_at: string;
  updated_at: string;
}

/** 점검 모드 모델 */
export interface MaintenanceMode {
  enabled: boolean;
  title: string;
  message: string;
  estimatedEndTime: string | null;
  allowedVersions: Array<{ platform: AppPlatform; version: string }>;
}
