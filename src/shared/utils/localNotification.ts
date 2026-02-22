/**
 * Local Notification Utility
 *
 * 앱 내에서 로컬 푸시 알림을 발송하는 유틸리티입니다.
 * 백그라운드 작업 완료 알림 등에 사용합니다.
 */
import * as Notifications from 'expo-notifications';
import { routePages } from '@/shared/navigation/constant/routePages';

interface LocalNotificationOptions {
  title: string;
  body: string;
  /** 알림 클릭 시 이동할 화면 */
  screen?: string;
  /** 화면 이동 시 전달할 파라미터 */
  params?: Record<string, unknown>;
}

/**
 * 로컬 푸시 알림 발송
 *
 * @param options 알림 옵션
 * @returns 알림 식별자
 *
 * @example
 * // 콘텐츠 등록 완료 알림
 * await sendLocalNotification({
 *   title: '등록 완료',
 *   body: '10개 영상이 등록되었습니다.',
 *   screen: routePages.adminContentRegistration,
 * });
 */
export async function sendLocalNotification(
  options: LocalNotificationOptions,
): Promise<string | null> {
  const { title, body, screen, params } = options;

  try {
    // 딥링크 데이터 구성 (screen이 있을 때만 action 포함)
    const data = screen
      ? {
          action: {
            type: 'NAVIGATION',
            screen,
            params,
          },
        }
      : {};

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // 즉시 발송
    });

    if (__DEV__) {
      console.log('[LocalNotification] 알림 발송:', { title, body, screen });
    }

    return identifier;
  } catch (error) {
    console.error('[LocalNotification] 알림 발송 실패:', error);
    return null;
  }
}

/**
 * 콘텐츠 등록 시작 알림 발송
 *
 * @param totalCount 전체 등록 시도 수
 */
export async function sendContentRegistrationStartNotification(
  totalCount: number,
): Promise<string | null> {
  return sendLocalNotification({
    title: '콘텐츠 등록 시작',
    body: `${totalCount}개 영상 등록을 시작합니다. 잠시만 기다려주세요.`,
    screen: routePages.adminContentRegistration,
  });
}

/**
 * 콘텐츠 등록 완료 알림 발송
 *
 * @param successCount 성공한 등록 수
 * @param totalCount 전체 등록 시도 수
 */
export async function sendContentRegistrationCompleteNotification(
  successCount: number,
  totalCount: number,
): Promise<string | null> {
  const title = '콘텐츠 등록 완료';
  const body =
    successCount === totalCount
      ? `${successCount}개 콘텐츠가 등록되었습니다.`
      : `${totalCount}개 중 ${successCount}개가 등록되었습니다.`;

  return sendLocalNotification({
    title,
    body,
    screen: routePages.adminContentRegistration,
  });
}

/**
 * 채널 등록 시작 알림 발송
 *
 * @param channelName 채널 이름 또는 ID
 */
export async function sendChannelRegistrationStartNotification(
  channelName: string,
): Promise<string | null> {
  return sendLocalNotification({
    title: '채널 등록 시작',
    body: `${channelName} 채널 등록을 시작합니다. 잠시만 기다려주세요.`,
    screen: routePages.adminContentRegistration,
  });
}

/**
 * 채널 등록 완료 알림 발송
 *
 * @param channelName 채널 이름
 * @param successCount 성공한 등록 수
 */
export async function sendChannelRegistrationCompleteNotification(
  channelName: string,
  successCount: number,
): Promise<string | null> {
  const title = '채널 등록 완료';
  const body = `${channelName} 채널에서 ${successCount}개 영상이 등록되었습니다.`;

  return sendLocalNotification({
    title,
    body,
    screen: routePages.adminContentRegistration,
  });
}
