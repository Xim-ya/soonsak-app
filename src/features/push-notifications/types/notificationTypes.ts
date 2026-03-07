/**
 * Push Notification 타입 정의
 *
 * 푸시 알림 페이로드의 타입 안전성을 보장합니다.
 * NAVIGATION(화면 이동)과 ACTION(시스템 액션) 두 가지 타입을 지원합니다.
 *
 * 딥링크 지원 화면은 routeRegistry에서 관리됩니다.
 * 새 딥링크 화면 추가 시 routeRegistry.ts만 수정하세요.
 *
 * @see src/presentation/navigation/config/routeRegistry.ts
 * @see docs/push-notification-deep-link-spec.md
 */

import type { RootStackParamList } from '@/presentation/navigation/types';
import {
  DEEP_LINK_SCREENS as DEEP_LINK_SCREENS_SOURCE,
  isDeepLinkScreen,
  type DeepLinkScreen as DeepLinkScreenType,
} from '@/presentation/navigation/config/routeRegistry';

/** Notification Action 타입 */
export type NotificationActionType = 'NAVIGATION' | 'ACTION';

/** 시스템 액션 종류 */
export type SystemAction =
  | 'LOGOUT'
  | 'REQUEST_REVIEW'
  | 'OPEN_SETTINGS'
  | 'OPEN_URL'
  | 'REFRESH_DATA';

/** routeRegistry에서 딥링크 지원 화면 목록 re-export */
export const DEEP_LINK_SCREENS = DEEP_LINK_SCREENS_SOURCE;

export type DeepLinkScreen = DeepLinkScreenType;

/**
 * NAVIGATION 액션
 *
 * 앱 내 특정 화면으로 이동합니다.
 */
export interface NavigationAction<T extends DeepLinkScreen = DeepLinkScreen> {
  type: 'NAVIGATION';
  screen: T;
  params: RootStackParamList[T];
}

/**
 * ACTION 액션
 *
 * 화면 이동 외의 시스템 동작을 수행합니다.
 */
export interface SystemActionPayload {
  type: 'ACTION';
  action: SystemAction;
  payload?: Record<string, unknown>;
}

/** 통합 알림 데이터 */
export type NotificationData = NavigationAction | SystemActionPayload;

/**
 * 전체 페이로드
 *
 * 서버에서 전송하는 푸시 알림의 data 필드 구조입니다.
 */
export interface NotificationPayload {
  version?: string;
  id?: string;
  action: NotificationData;
}

/* ========================================
 * 타입 가드 함수
 * ======================================== */

/**
 * NAVIGATION 액션인지 확인
 */
export function isNavigationAction(data: NotificationData): data is NavigationAction {
  return data.type === 'NAVIGATION';
}

/**
 * ACTION(시스템 액션)인지 확인
 */
export function isSystemAction(data: NotificationData): data is SystemActionPayload {
  return data.type === 'ACTION';
}

/**
 * 유효한 딥링크 화면인지 확인
 */
export function isValidDeepLinkScreen(screen: string): screen is DeepLinkScreen {
  return isDeepLinkScreen(screen);
}

/**
 * 유효한 NotificationPayload인지 확인
 *
 * 잘못된 페이로드로 인한 앱 크래시를 방지합니다.
 */
export function isValidNotificationPayload(raw: unknown): raw is NotificationPayload {
  if (!raw || typeof raw !== 'object') return false;

  const payload = raw as Record<string, unknown>;
  if (!payload['action'] || typeof payload['action'] !== 'object') return false;

  const action = payload['action'] as Record<string, unknown>;

  // NAVIGATION 타입 검증
  if (action['type'] === 'NAVIGATION') {
    if (typeof action['screen'] !== 'string') return false;
    if (!isValidDeepLinkScreen(action['screen'])) return false;
    return true;
  }

  // ACTION 타입 검증
  if (action['type'] === 'ACTION') {
    if (typeof action['action'] !== 'string') return false;
    return true;
  }

  return false;
}
