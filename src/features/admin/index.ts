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
  // Push Action Types
  type PushData,
  type PushAction,
  type ActionTypeOption,
  ACTION_TYPE_OPTIONS,
  USER_CONTENT_TAB_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from './types';

// Utils
export {
  getRoleColor,
  formatDate,
  formatDateTime,
  formatCompactNumber,
  // YouTube URL parsing
  parseYouTubeVideoUrl,
  parseYouTubeChannelUrl,
  parseMultipleVideoUrls,
  type YouTubeVideoParseResult,
  type YouTubeChannelParseResult,
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
  type UserContentItem,
} from './api/adminUserApi';

// API - Registration
export {
  adminRegistrationApi,
  type VideoRegistrationResult,
  type ChannelRegistrationResult,
  type ChannelRegistrationResultItem,
  type BatchRegistrationResult,
  type BatchRegistrationResultItem,
} from './api/adminRegistrationApi';

// Services
export {
  contentRegistrationService,
  type RegistrationState,
  type VideoRegistrationState,
  type ChannelRegistrationState,
} from './services/contentRegistrationService';
