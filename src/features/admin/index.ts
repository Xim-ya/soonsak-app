/**
 * features/admin
 *
 * 어드민 비즈니스 로직 Public API
 */

// Types
export { AdminContentAction, ADMIN_CONTENT_ACTIONS, type AdminActionConfig } from './types';

// Hooks
export { useAdminContentActions } from './hooks/useAdminContentActions';

// API
export {
  adminContentApi,
  adminVideoApi,
  type ContentVideoItem,
  type VideoManagementItem,
  type VideoStatusCounts,
  type VideoManagementListResult,
} from './api/adminContentApi';
