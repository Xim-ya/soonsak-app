/**
 * Push Notifications Feature
 *
 * Expo Push Notifications + Supabase 기반 푸시 알림 시스템
 *
 * @see docs/push-notification-deep-link-spec.md
 */

// API
export { pushTokenApi } from './api/pushTokenApi';
export type { PushTokenDto } from './api/pushTokenApi';

// Types
export {
  type NotificationActionType,
  type SystemAction,
  type DeepLinkScreen,
  type NavigationAction,
  type SystemActionPayload,
  type NotificationData,
  type NotificationPayload,
  DEEP_LINK_SCREENS,
  isNavigationAction,
  isSystemAction,
  isValidDeepLinkScreen,
  isValidNotificationPayload,
} from './types/notificationTypes';

// Handlers
export { handleNotification, handlePendingNavigation } from './handlers/notificationHandler';

// Store
export { pendingNavigationStore } from './store/pendingNavigationStore';

// Config
export { linkingConfig } from './config/linkingConfig';

// Providers
export { PushNotificationProvider, usePushNotification } from './providers';
