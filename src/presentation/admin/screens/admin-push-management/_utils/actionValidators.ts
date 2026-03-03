/**
 * actionValidators - 액션 파라미터 유효성 검사
 *
 * Strategy Pattern을 사용하여 각 액션 타입별 검증 로직을 분리합니다.
 */

import type { ActionTypeOption } from '@/features/admin';

// ============================================================================
// Types
// ============================================================================

export interface ActionParams {
  contentId?: string;
  contentTitle?: string;
  contentType?: 'movie' | 'tv';
  videoId?: string;
  videoTitle?: string;
  playerContentId?: string;
  playerContentType?: 'movie' | 'tv';
  startSeconds?: string;
  channelId?: string;
  channelName?: string;
  initialTab?: 0 | 1 | 2;
  url?: string;
  refreshTarget?: string;
}

type ActionValidator = (params: ActionParams) => boolean;

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidPositiveInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Number.isInteger(num);
}

export function isValidNonNegativeInt(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Number.isInteger(num);
}

// ============================================================================
// Navigation Validators (Strategy Pattern)
// ============================================================================

const navigationValidators: Record<string, ActionValidator> = {
  ContentDetail: (params) =>
    isValidPositiveInt(params.contentId) && !!params.contentType,

  Player: (params) =>
    !!(
      params.videoId &&
      isValidPositiveInt(params.playerContentId) &&
      params.playerContentType &&
      (params.startSeconds === undefined ||
        params.startSeconds === '' ||
        isValidNonNegativeInt(params.startSeconds))
    ),

  ChannelDetail: (params) => !!params.channelId?.trim(),

  Search: () => true,
  Settings: () => true,
  ReviewFunnel: () => true,

  UserContentList: (params) => params.initialTab !== undefined,
};

// ============================================================================
// Action Validators (Strategy Pattern)
// ============================================================================

const actionValidators: Record<string, ActionValidator> = {
  OPEN_URL: (params) => {
    const url = params.url?.trim() ?? '';
    return url.length > 0 && isValidUrl(url);
  },

  REFRESH_DATA: (params) => !!params.refreshTarget?.trim(),

  REQUEST_REVIEW: () => true,
  OPEN_SETTINGS: () => true,
};

// ============================================================================
// Main Validator
// ============================================================================

/**
 * 선택된 액션에 대한 파라미터 유효성 검사
 */
export function validateActionParams(
  selectedAction: ActionTypeOption,
  params: ActionParams,
): boolean {
  if (selectedAction.type === 'none') {
    return true;
  }

  if (selectedAction.type === 'navigation' && selectedAction.screen) {
    const validator = navigationValidators[selectedAction.screen];
    return validator ? validator(params) : true;
  }

  if (selectedAction.type === 'action' && selectedAction.action) {
    const validator = actionValidators[selectedAction.action];
    return validator ? validator(params) : true;
  }

  return true;
}
