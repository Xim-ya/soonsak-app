/**
 * Notification API
 *
 * 사용자의 푸시 알림 내역을 조회하고 관리하는 API 함수들을 제공합니다.
 * - 알림 목록 조회 (무한 스크롤)
 * - 읽지 않은 알림 개수 조회
 * - 알림 읽음 처리
 */

import { supabaseClient } from '@/shared/api/supabaseClient';
import { PUSH_DATABASE } from '@/shared/config/dbConfig';
import { Logger } from '@/shared/utils/logger';

const NotificationLogger = Logger.create('Notification');
import type {
  NotificationListParams,
  NotificationListResult,
  UnreadNotificationCount,
  RawPushNotification,
} from '../types/notificationListTypes';
import type { PushNotificationType, PushActionType } from '@/features/admin/api/adminPushApi';

/** 페이지네이션 상수 */
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;

/** 빈 결과 상수 - 재사용으로 일관된 반환 보장 */
const EMPTY_NOTIFICATION_RESULT: NotificationListResult = Object.freeze({
  notifications: [],
  hasMore: false,
  nextCursor: null,
});

const ZERO_UNREAD_COUNT: UnreadNotificationCount = Object.freeze({ count: 0 });

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * pushToken 유무에 따라 적절한 push_token_id를 조회합니다.
 * - pushToken이 있으면: 해당 토큰으로 조회
 * - pushToken이 없으면: 유저의 활성 토큰 조회
 *
 * @description Cohesion 원칙 - 중복 로직 통합
 */
async function resolvePushTokenId(
  userId: string,
  pushToken?: string | null,
): Promise<string | null> {
  if (pushToken) {
    return getPushTokenIdByToken(userId, pushToken);
  }
  return getActivePushTokenId(userId);
}

/**
 * Expo Push Token으로 push_token_id 조회
 */
async function getPushTokenIdByToken(userId: string, pushToken: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
    .select('id')
    .eq('user_id', userId)
    .eq('token', pushToken)
    .single();

  if (error || !data) {
    NotificationLogger.warn('push_token_id 조회 실패:', error?.message);
    return null;
  }

  return data.id;
}

/**
 * 유저의 활성 push_token_id 조회 (가장 최근 것)
 */
async function getActivePushTokenId(userId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * 페이지 크기 정규화
 * @description Readability 원칙 - 매직 넘버 제거 및 의미 명확화
 */
function normalizePageSize(limit: number): number {
  return Math.min(Math.max(limit, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
}

/** 커서 구분자 */
const CURSOR_DELIMITER = '|';

/**
 * 복합 커서 생성 (created_at|id)
 * @description 동일 타임스탬프 레코드 누락 방지
 */
function createCompositeCursor(createdAt: string, id: string): string {
  return `${createdAt}${CURSOR_DELIMITER}${id}`;
}

/**
 * 복합 커서 파싱
 * @returns [createdAt, id] 또는 null (유효하지 않은 커서)
 */
function parseCompositeCursor(cursor: string): [string, string] | null {
  const parts = cursor.split(CURSOR_DELIMITER);
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return [parts[0], parts[1]];
}

/** DB 응답 아이템 타입 (Supabase 응답 구조) */
interface NotificationReceiptRow {
  id: string;
  notification_id: string;
  read_at: string | null;
  clicked_at: string | null;
  created_at: string;
  push_notifications: RawPushNotification | RawPushNotification[] | null;
}

/**
 * DB 응답을 NotificationItem으로 변환
 * @description Cohesion 원칙 - 변환 로직 분리
 */
function mapToNotificationItem(item: NotificationReceiptRow) {
  // Supabase join 결과는 배열 또는 단일 객체일 수 있음
  const rawNotification = item.push_notifications;
  const notification = Array.isArray(rawNotification) ? rawNotification[0] : rawNotification;

  return {
    id: item.id,
    notificationId: item.notification_id,
    title: notification?.title ?? '',
    body: notification?.body ?? '',
    notificationType: (notification?.notification_type ?? 'system') as PushNotificationType,
    actionType: (notification?.action_type ?? 'none') as PushActionType,
    data: (notification?.data as Record<string, unknown>) ?? null,
    readAt: item.read_at,
    clickedAt: item.clicked_at,
    createdAt: item.created_at,
  };
}

// ============================================================================
// Public API
// ============================================================================

export const notificationApi = {
  /**
   * 알림 목록 조회
   *
   * 현재 로그인한 사용자의 알림 내역을 조회합니다.
   * pushToken이 제공되면 해당 디바이스로 전송된 알림만 조회합니다.
   * 커서 기반 페이지네이션을 지원합니다.
   *
   * @param userId 사용자 ID
   * @param params 페이지네이션 파라미터 (pushToken 포함)
   */
  getNotifications: async (
    userId: string,
    params: NotificationListParams = {},
  ): Promise<NotificationListResult> => {
    const { cursor, limit = DEFAULT_PAGE_SIZE, pushToken } = params;
    const normalizedLimit = normalizePageSize(limit);

    // 통합된 pushTokenId 조회 로직 사용
    const pushTokenId = await resolvePushTokenId(userId, pushToken);

    // push_token_id를 찾지 못하면 빈 결과 반환 (Predictability - 일관된 반환)
    if (!pushTokenId) {
      return EMPTY_NOTIFICATION_RESULT;
    }

    let query = supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .select(
        `
        id,
        notification_id,
        read_at,
        clicked_at,
        created_at,
        push_notifications!push_notification_receipts_notification_id_fkey (
          title,
          body,
          notification_type,
          action_type,
          data
        )
      `,
      )
      .eq('user_id', userId)
      .eq('push_token_id', pushTokenId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }); // 동일 타임스탬프 레코드 순서 보장

    // 복합 커서 기반 페이지네이션 (created_at|id)
    // 동일 타임스탬프 레코드 누락 방지
    if (cursor) {
      const parsedCursor = parseCompositeCursor(cursor);
      if (parsedCursor) {
        const [cursorCreatedAt, cursorId] = parsedCursor;
        // (created_at, id) < (cursor_created_at, cursor_id) 조건
        // Supabase에서 or 조건으로 구현
        query = query.or(
          `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`,
        );
      } else {
        // 레거시 커서 호환성 (created_at만 있는 경우)
        query = query.lt('created_at', cursor);
      }
    }

    // +1로 다음 페이지 존재 여부 확인
    query = query.limit(normalizedLimit + 1);

    const { data, error } = await query;

    if (error) {
      NotificationLogger.error('알림 목록 조회 실패:', error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    const notificationsData = data ?? [];
    const hasMore = notificationsData.length > normalizedLimit;
    const notifications = notificationsData.slice(0, normalizedLimit);

    // 복합 커서 생성 (created_at|id)
    const lastItem = notifications[notifications.length - 1];
    const nextCursor =
      hasMore && lastItem ? createCompositeCursor(lastItem.created_at, lastItem.id) : null;

    return {
      notifications: notifications.map(mapToNotificationItem),
      hasMore,
      nextCursor,
    };
  },

  /**
   * 읽지 않은 알림 개수 조회
   *
   * pushToken이 제공되면 해당 디바이스로 전송된 알림만 카운트합니다.
   *
   * @param userId 사용자 ID
   * @param pushToken 현재 디바이스의 Expo Push Token (선택)
   */
  getUnreadCount: async (
    userId: string,
    pushToken?: string | null,
  ): Promise<UnreadNotificationCount> => {
    // 통합된 pushTokenId 조회 로직 사용
    const pushTokenId = await resolvePushTokenId(userId, pushToken);

    // push_token_id를 찾지 못하면 0 반환 (Predictability - 일관된 반환)
    if (!pushTokenId) {
      return ZERO_UNREAD_COUNT;
    }

    const { count, error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('push_token_id', pushTokenId)
      .is('read_at', null);

    if (error) {
      NotificationLogger.error('읽지 않은 알림 개수 조회 실패:', error);
      throw new Error(`Failed to fetch unread count: ${error.message}`);
    }

    return { count: count ?? 0 };
  },

  /**
   * 알림 읽음 처리
   *
   * @param notificationId 알림 ID (push_notifications)
   * @param userId 사용자 ID
   * @throws Error Supabase 에러 발생 시
   */
  markAsRead: async (notificationId: string, userId: string): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  },

  /**
   * 알림 클릭 처리
   *
   * @param notificationId 알림 ID (push_notifications)
   * @param userId 사용자 ID
   * @throws Error Supabase 에러 발생 시
   */
  markAsClicked: async (notificationId: string, userId: string): Promise<void> => {
    const now = new Date().toISOString();

    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .update({
        clicked_at: now,
        read_at: now, // 클릭 시 읽음 처리도 함께
      })
      .eq('notification_id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to mark notification as clicked: ${error.message}`);
    }
  },

  /**
   * 모든 알림 읽음 처리
   *
   * @param userId 사용자 ID
   * @throws Error Supabase 에러 발생 시
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  },
};
