/**
 * Notifications Feature Module
 *
 * 사용자 알림 관련 기능을 제공합니다.
 */

// Types
export type {
  NotificationItem,
  NotificationListParams,
  NotificationListResult,
  UnreadNotificationCount,
  RawPushNotification,
} from './types/notificationListTypes';

export type {
  NotificationQueryKeys,
  NotificationAllKey,
  NotificationListKey,
  NotificationUnreadCountKey,
} from './hooks/notificationQueryKeys';

// API
export { notificationApi } from './api/notificationApi';

// Hooks
export { notificationKeys } from './hooks/notificationQueryKeys';
export {
  useUnreadNotificationCount,
  useInfiniteNotifications,
  useMarkNotificationAsRead,
  useMarkNotificationAsClicked,
  useMarkAllNotificationsAsRead,
} from './hooks/useNotifications';
export { useSyncAppBadge, clearAppBadge } from './hooks/useSyncAppBadge';
