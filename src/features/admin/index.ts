/**
 * features/admin
 *
 * 어드민 비즈니스 로직 Public API
 */

// Types
export {
  AdminContentAction,
  ADMIN_CONTENT_ACTIONS,
  type AdminActionConfig,
  // User Management Types
  UserRoleLabel,
  UserRoleFilterLabel,
  UserSortByLabel,
  UserSearchFieldLabel,
  type UserRoleFilter,
  type UserSortBy,
  type UserSearchField,
} from './types';

// Utils
export {
  getRoleColor,
  formatDate,
  formatDateTime,
  formatCompactNumber,
} from './utils';

// Hooks
export { useAdminContentActions } from './hooks/useAdminContentActions';

// API - Content
export {
  adminContentApi,
  adminVideoApi,
  type ContentVideoItem,
  type VideoManagementItem,
  type VideoStatusCounts,
  type VideoManagementListResult,
} from './api/adminContentApi';

// API - User
export {
  adminUserApi,
  type UserManagementItem,
  type UserDetailItem,
  type UserStatistics,
  type UserRoleCounts,
  type UserListParams,
  type UserListResult,
  type PushTokenInfo,
} from './api/adminUserApi';
