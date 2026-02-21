/**
 * Admin Types
 *
 * 어드민 전용 타입 정의
 */

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
