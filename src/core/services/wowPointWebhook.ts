/**
 * 와우 포인트 Slack 웹훅 서비스
 * 유저의 주요 활동을 Slack으로 실시간 알림
 */

import { supabaseClient } from '@/core/api';

const SLACK_WEBHOOK_URL = process.env['EXPO_PUBLIC_SLACK_WEBHOOK_URL'];
const EXCLUDED_USER_IDS = (process.env['EXPO_PUBLIC_EXCLUDED_USER_IDS'] ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/** 현재 로그인한 유저 ID 가져오기 */
const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabaseClient.auth.getSession();
  return data.session?.user?.id ?? null;
};

/** 제외 대상 유저인지 확인 */
const isExcludedUser = (userId: string | null): boolean => {
  if (!userId) return false;
  return EXCLUDED_USER_IDS.includes(userId);
};

type WowPointEvent =
  | 'app_entry'
  | 'login'
  | 'signup'
  | 'logout'
  | 'withdraw'
  | 'video_play'
  | 'video_complete'
  | 'video_rating'
  | 'video_favorite'
  | 'channel_favorite';

interface WowPointPayload {
  event: WowPointEvent;
  nickname?: string;
  isLoggedIn?: boolean;
  videoTitle?: string;
  channelName?: string;
  rating?: number;
  visitCount?: number;
  lastVisitAt?: string | null;
}

/** 시간 차이를 사람이 읽기 쉬운 형태로 변환 */
const formatTimeDiff = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';

  const now = new Date();
  const past = new Date(isoDate);
  const diffMs = now.getTime() - past.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}일 ${remainingHours}시간 전` : `${days}일 전`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분 전` : `${hours}시간 전`;
  }
  if (minutes > 0) {
    return `${minutes}분 전`;
  }
  return '방금 전';
};

const formatMessage = (payload: WowPointPayload): string => {
  const { event, nickname, isLoggedIn, videoTitle, channelName, rating, visitCount, lastVisitAt } =
    payload;
  const userDisplay = nickname || (isLoggedIn ? '회원' : '비회원');

  switch (event) {
    case 'app_entry': {
      const visitInfo = visitCount ? `${visitCount}번째 방문` : '';
      const lastVisitInfo = lastVisitAt ? `마지막 방문 ${formatTimeDiff(lastVisitAt)}` : '';
      const details = [visitInfo, lastVisitInfo].filter(Boolean).join(' • ');

      if (!isLoggedIn) {
        const baseMsg = `👀 비회원이 순삭을 구경하고 있어요`;
        return details ? `${baseMsg}\n└ ${details}` : baseMsg;
      }
      return details
        ? `👋 ${userDisplay}님이 순삭에 들어왔어요\n└ ${details}`
        : `👋 ${userDisplay}님이 순삭에 들어왔어요`;
    }

    case 'login':
      return `🔓 ${userDisplay}님이 로그인했어요`;

    case 'signup':
      return `🎉 ${userDisplay}님이 순삭에 가입했어요! 환영해요`;

    case 'logout':
      return `👋 ${userDisplay}님이 로그아웃했어요`;

    case 'withdraw':
      return `😢 ${userDisplay}님이 순삭을 떠났어요`;

    case 'video_play':
      return videoTitle
        ? `▶️ ${userDisplay}님이 "${videoTitle}" 영상을 재생했어요`
        : `▶️ ${userDisplay}님이 영상을 재생했어요`;

    case 'video_complete':
      return videoTitle
        ? `🎬 ${userDisplay}님이 "${videoTitle}" 영상을 다 봤어요!`
        : `🎬 ${userDisplay}님이 영상을 다 봤어요!`;

    case 'video_rating': {
      const stars = rating ? '⭐'.repeat(Math.min(rating, 5)) : '';
      return videoTitle
        ? `${stars} ${userDisplay}님이 "${videoTitle}"에 ${rating}점을 남겼어요`
        : `${stars} ${userDisplay}님이 영상에 ${rating}점을 남겼어요`;
    }

    case 'video_favorite':
      return videoTitle
        ? `❤️ ${userDisplay}님이 "${videoTitle}"을 찜했어요`
        : `❤️ ${userDisplay}님이 영상을 찜했어요`;

    case 'channel_favorite':
      return channelName
        ? `📺 ${userDisplay}님이 "${channelName}" 채널을 찜했어요`
        : `📺 ${userDisplay}님이 채널을 찜했어요`;

    default:
      return `✨ ${userDisplay}님이 활동했어요`;
  }
};

const sendWebhook = async (text: string): Promise<void> => {
  if (!SLACK_WEBHOOK_URL) return;

  // 현재 유저가 제외 대상인지 확인
  const userId = await getCurrentUserId();
  if (isExcludedUser(userId)) return;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    // 웹훅 실패는 무시 (사용자 경험에 영향 없음)
  }
};

export const wowPointWebhook = {
  /**
   * 앱 진입 시 호출
   */
  onAppEntry: (params: {
    nickname?: string;
    isLoggedIn: boolean;
    visitCount?: number;
    lastVisitAt?: string | null;
  }) => {
    const message = formatMessage({
      event: 'app_entry',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 로그인 시 호출
   */
  onLogin: (params: { nickname?: string }) => {
    const message = formatMessage({
      event: 'login',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 회원가입 시 호출
   */
  onSignup: (params: { nickname?: string }) => {
    const message = formatMessage({
      event: 'signup',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 영상 재생 시 호출
   */
  onVideoPlay: (params: { nickname?: string; videoTitle?: string }) => {
    const message = formatMessage({
      event: 'video_play',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 영상 평점 남길 때 호출
   */
  onVideoRating: (params: { nickname?: string; videoTitle?: string; rating: number }) => {
    const message = formatMessage({
      event: 'video_rating',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 영상 찜할 때 호출
   */
  onVideoFavorite: (params: { nickname?: string; videoTitle?: string }) => {
    const message = formatMessage({
      event: 'video_favorite',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 채널 찜할 때 호출
   */
  onChannelFavorite: (params: { nickname?: string; channelName?: string }) => {
    const message = formatMessage({
      event: 'channel_favorite',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 영상 시청 완료 시 호출 (88% 이상)
   */
  onVideoComplete: (params: { nickname?: string; videoTitle?: string }) => {
    const message = formatMessage({
      event: 'video_complete',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 로그아웃 시 호출
   */
  onLogout: (params: { nickname?: string }) => {
    const message = formatMessage({
      event: 'logout',
      ...params,
    });
    sendWebhook(message);
  },

  /**
   * 회원탈퇴 시 호출
   */
  onWithdraw: (params: { nickname?: string }) => {
    const message = formatMessage({
      event: 'withdraw',
      ...params,
    });
    sendWebhook(message);
  },
};

export default wowPointWebhook;
