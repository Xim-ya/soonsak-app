/**
 * Push Management Screen Types
 */

import type {
  PushTemplateListItem,
  PushStatistics,
  PushScheduleStatus,
  PushReceiptWithUserItem,
  PushDeliveryStatus,
} from '@/features/admin/api/adminPushApi';

/** 푸시 관리 화면에서 사용하는 템플릿 모델 */
export interface PushTemplateModel extends PushTemplateListItem {
  /** 스케줄 상태 한글 라벨 */
  scheduleStatusLabel: string;
  /** 다음 실행 시간 포맷팅 */
  nextRunAtFormatted: string | null;
  /** 마지막 실행 시간 포맷팅 */
  lastRunAtFormatted: string | null;
}

/** 스케줄 상태별 한글 라벨 */
export const SCHEDULE_STATUS_LABELS: Record<PushScheduleStatus, string> = {
  draft: '초안',
  scheduled: '예약됨',
  processing: '처리중',
  sent: '발송완료',
  cancelled: '취소됨',
  failed: '실패',
};

/** 발송 상태별 한글 라벨 */
export const DELIVERY_STATUS_LABELS: Record<PushDeliveryStatus, string> = {
  pending: '대기',
  sent: '발송됨',
  delivered: '전달됨',
  failed: '실패',
  expired: '만료',
};

/** 푸시 발송 내역 모델 (화면용) */
export interface PushReceiptModel extends PushReceiptWithUserItem {
  /** 발송 상태 한글 라벨 */
  deliveryStatusLabel: string;
  /** 읽음 여부 */
  isRead: boolean;
  /** 클릭 여부 */
  isClicked: boolean;
  /** 발송 시간 포맷팅 */
  sentAtFormatted: string | null;
  /** 생성 시간 포맷팅 */
  createdAtFormatted: string;
}

/** 푸시 통계 모델 */
export type PushStatisticsModel = PushStatistics;

/** 푸시 관리 탭 */
export type PushManagementTab = 'receipts' | 'templates';
