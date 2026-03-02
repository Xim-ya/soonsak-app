/**
 * 알림 목록 관련 타입 정의
 *
 * 푸시 알림 내역 조회 및 표시에 사용되는 타입들을 정의합니다.
 */

import type { PushNotificationType, PushActionType } from '@/features/admin/api/adminPushApi';

// ============================================================================
// Internal Types (API 레이어에서 사용)
// ============================================================================

/** DB에서 조회한 raw 알림 데이터 */
export interface RawPushNotification {
  title?: string;
  body?: string;
  notification_type?: string;
  action_type?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Public Types
// ============================================================================

/** 알림 아이템 (목록용) */
export interface NotificationItem {
  /** Receipt ID */
  id: string;
  /** 알림 ID (push_notifications) */
  notificationId: string;
  /** 알림 제목 */
  title: string;
  /** 알림 내용 */
  body: string;
  /** 알림 타입 */
  notificationType: PushNotificationType;
  /** 액션 타입 */
  actionType: PushActionType;
  /** 액션 데이터 (딥링크용) */
  data: Record<string, unknown> | null;
  /** 읽음 시간 */
  readAt: string | null;
  /** 클릭 시간 */
  clickedAt: string | null;
  /** 생성 시간 */
  createdAt: string;
}

/** 알림 목록 조회 파라미터 */
export interface NotificationListParams {
  /** 커서 (페이지네이션) */
  cursor?: string | null;
  /** 페이지 크기 */
  limit?: number;
  /** 현재 기기의 푸시 토큰 (필터링용) */
  pushToken?: string | null;
}

/** 알림 목록 조회 결과 */
export interface NotificationListResult {
  notifications: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** 읽지 않은 알림 개수 */
export interface UnreadNotificationCount {
  count: number;
}
