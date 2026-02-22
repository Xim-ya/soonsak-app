/**
 * Admin Types
 *
 * 어드민 전용 타입 정의
 */

import type { UserRole } from '@/features/auth/types';

// Push Action Types
export * from './pushAction';

// ============================================================================
// User Management Types
// ============================================================================

/**
 * 유저 역할 라벨
 */
export const UserRoleLabel: Record<UserRole, string> = {
  user: '일반',
  admin: '관리자',
  banned: '차단',
} as const;

/**
 * 유저 역할 필터 타입 (전체 포함)
 */
export type UserRoleFilter = UserRole | 'all';

/**
 * 유저 역할 필터 라벨
 */
export const UserRoleFilterLabel: Record<UserRoleFilter, string> = {
  all: '전체',
  user: '일반',
  admin: '관리자',
  banned: '차단',
} as const;

/**
 * 유저 목록 정렬 기준
 */
export type UserSortBy = 'createdAt' | 'lastLoginAt' | 'entryCount';

/**
 * 유저 목록 정렬 라벨
 */
export const UserSortByLabel: Record<UserSortBy, string> = {
  createdAt: '가입일순',
  lastLoginAt: '최근 로그인순',
  entryCount: '방문 횟수순',
} as const;

/**
 * 유저 검색 필드
 */
export type UserSearchField = 'email' | 'displayName';

/**
 * 유저 검색 필드 라벨
 */
export const UserSearchFieldLabel: Record<UserSearchField, string> = {
  email: '이메일',
  displayName: '닉네임',
} as const;

// ============================================================================
// Content Management Types
// ============================================================================

/**
 * 어드민 콘텐츠 액션 타입
 *
 * 콘텐츠 상세 페이지에서 어드민이 수행할 수 있는 액션
 */
export const AdminContentAction = {
  /** 메인 이미지(backdrop) 변경 */
  CHANGE_BACKDROP: 'CHANGE_BACKDROP',
  /** 비디오 상태 변경 */
  CHANGE_VIDEO_STATUS: 'CHANGE_VIDEO_STATUS',
  /** 콘텐츠 교체 (비디오를 다른 콘텐츠로 재매핑) */
  CHANGE_CONTENT: 'CHANGE_CONTENT',
  /** 대표 비디오 변경 */
  CHANGE_PRIMARY_VIDEO: 'CHANGE_PRIMARY_VIDEO',
  /** 결말포함 여부 변경 */
  CHANGE_INCLUDES_ENDING: 'CHANGE_INCLUDES_ENDING',
} as const;

export type AdminContentAction = (typeof AdminContentAction)[keyof typeof AdminContentAction];

/**
 * 어드민 액션 설정
 */
export interface AdminActionConfig {
  /** 액션 타입 */
  action: AdminContentAction;
  /** 표시 텍스트 */
  label: string;
  /** 위험한 액션 여부 (삭제 등) */
  isDestructive?: boolean;
  /** 비활성화 여부 (조건에 따라 동적으로 설정) */
  disabled?: boolean;
  /** 비활성화 시 표시할 설명 */
  disabledReason?: string;
}

/**
 * 어드민 콘텐츠 액션 설정 목록
 */
export const ADMIN_CONTENT_ACTIONS: AdminActionConfig[] = [
  {
    action: AdminContentAction.CHANGE_BACKDROP,
    label: '메인 이미지 변경',
  },
  {
    action: AdminContentAction.CHANGE_VIDEO_STATUS,
    label: '비디오 상태 변경',
  },
  {
    action: AdminContentAction.CHANGE_CONTENT,
    label: '콘텐츠 교체',
  },
  {
    action: AdminContentAction.CHANGE_PRIMARY_VIDEO,
    label: '대표 비디오 변경',
  },
  {
    action: AdminContentAction.CHANGE_INCLUDES_ENDING,
    label: '결말포함 여부 변경', // 동적 라벨은 훅에서 처리
  },
];
