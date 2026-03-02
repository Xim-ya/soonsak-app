/**
 * Notification Query Key Factory
 *
 * 알림 관련 React Query 캐시 키를 중앙 관리합니다.
 * 계층적 구조로 일괄 무효화와 개별 쿼리 관리가 용이합니다.
 *
 * @description
 * - Predictability 원칙: 일관된 키 구조로 예측 가능한 캐시 관리
 * - Cohesion 원칙: 모든 쿼리 키를 한 곳에서 관리
 *
 * @example
 * // 개별 쿼리
 * queryKey: notificationKeys.list(userId, pushToken)
 *
 * // 알림 전체 캐시 무효화
 * queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) })
 */

// ============================================================================
// Types
// ============================================================================

/** 쿼리 키 타입 정의 */
export type NotificationQueryKeys = typeof notificationKeys;

/** 각 쿼리 키의 반환 타입 */
export type NotificationAllKey = ReturnType<NotificationQueryKeys['all']>;
export type NotificationListKey = ReturnType<NotificationQueryKeys['list']>;
export type NotificationUnreadCountKey = ReturnType<NotificationQueryKeys['unreadCount']>;

// ============================================================================
// Constants
// ============================================================================

/** 루트 키 상수 */
const ROOT_KEY = 'notifications' as const;

/** 서브키 상수 */
const SUB_KEYS = {
  LIST: 'list',
  UNREAD_COUNT: 'unreadCount',
} as const;

/** 기본 푸시 토큰 값 (토큰이 없을 때 사용) */
const DEFAULT_PUSH_TOKEN = 'all' as const;

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * 푸시 토큰을 정규화합니다.
 * null/undefined인 경우 'all'을 반환합니다.
 */
function normalizePushToken(pushToken?: string | null): string {
  return pushToken ?? DEFAULT_PUSH_TOKEN;
}

export const notificationKeys = {
  /** 알림 루트 키 - 전체 알림 캐시 무효화에 사용 */
  all: (userId: string | null) => [ROOT_KEY, userId] as const,

  /** 알림 목록 키 (디바이스별) */
  list: (userId: string | null, pushToken?: string | null) =>
    [...notificationKeys.all(userId), SUB_KEYS.LIST, normalizePushToken(pushToken)] as const,

  /** 읽지 않은 알림 개수 키 (디바이스별) */
  unreadCount: (userId: string | null, pushToken?: string | null) =>
    [
      ...notificationKeys.all(userId),
      SUB_KEYS.UNREAD_COUNT,
      normalizePushToken(pushToken),
    ] as const,
} as const;
