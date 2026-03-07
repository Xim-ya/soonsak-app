/**
 * pushDataBuilder - 푸시 데이터 빌더
 *
 * 액션 타입에 따라 적절한 PushData 구조를 생성합니다.
 */

import type { PushData, ActionTypeOption } from '@/features/admin';
import { PushLogger } from '@/core/utils';
import { isValidNonNegativeInt, type ActionParams } from './actionValidators';

// ============================================================================
// Navigation Params Builders
// ============================================================================

type NavigationParamsBuilder = (params: ActionParams) => Record<string, unknown>;

const navigationParamsBuilders: Record<string, NavigationParamsBuilder> = {
  ContentDetail: (params) => ({
    id: Number(params.contentId),
    title: params.contentTitle || '',
    type: params.contentType,
  }),

  Player: (params) => {
    const startSecondsValue = params.startSeconds?.trim();
    const startSeconds =
      startSecondsValue && isValidNonNegativeInt(startSecondsValue)
        ? Number(startSecondsValue)
        : undefined;

    return {
      videoId: params.videoId,
      title: params.videoTitle || '',
      contentId: Number(params.playerContentId),
      contentType: params.playerContentType,
      ...(startSeconds !== undefined && { startSeconds }),
    };
  },

  ChannelDetail: (params) => ({
    channelId: params.channelId,
    channelName: params.channelName || '',
  }),

  Search: () => ({}),
  Settings: () => ({}),
  ReviewFunnel: () => ({}),

  UserContentList: (params) => ({
    initialTab: params.initialTab ?? 0,
  }),
};

// ============================================================================
// Action Payload Builders
// ============================================================================

type ActionPayloadBuilder = (params: ActionParams) => PushData | undefined;

const actionPayloadBuilders: Record<string, ActionPayloadBuilder> = {
  OPEN_URL: (params) => ({
    version: '1.0',
    action: {
      type: 'ACTION',
      action: 'OPEN_URL',
      payload: { url: params.url?.trim() || '' },
    },
  }),

  REFRESH_DATA: (params) => ({
    version: '1.0',
    action: {
      type: 'ACTION',
      action: 'REFRESH_DATA',
      payload: { target: params.refreshTarget?.trim() || '' },
    },
  }),

  REQUEST_REVIEW: () => ({
    version: '1.0',
    action: {
      type: 'ACTION',
      action: 'REQUEST_REVIEW',
    },
  }),

  OPEN_SETTINGS: () => ({
    version: '1.0',
    action: {
      type: 'ACTION',
      action: 'OPEN_SETTINGS',
    },
  }),
};

// ============================================================================
// Main Builder
// ============================================================================

/**
 * 선택된 액션과 파라미터를 기반으로 PushData 생성
 */
export function buildPushData(
  selectedAction: ActionTypeOption,
  params: ActionParams,
): PushData | undefined {
  if (selectedAction.type === 'none') {
    return undefined;
  }

  // Navigation 타입
  if (selectedAction.type === 'navigation' && selectedAction.screen) {
    const screen = selectedAction.screen;
    const paramsBuilder = navigationParamsBuilders[screen];

    // 알 수 없는 화면에 대한 빌더가 없으면 빠르게 실패
    if (!paramsBuilder) {
      PushLogger.error(`Unknown navigation screen: ${screen}`);
      return undefined;
    }

    const navigationParams = paramsBuilder(params);

    return {
      version: '1.0',
      action: {
        type: 'NAVIGATION',
        screen,
        params: navigationParams,
      },
    } as PushData;
  }

  // Action 타입
  if (selectedAction.type === 'action' && selectedAction.action) {
    const action = selectedAction.action;
    const payloadBuilder = actionPayloadBuilders[action];
    return payloadBuilder ? payloadBuilder(params) : undefined;
  }

  return undefined;
}
