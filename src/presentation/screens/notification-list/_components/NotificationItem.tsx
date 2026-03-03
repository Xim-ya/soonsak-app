/**
 * NotificationItemView - 알림 아이템 컴포넌트
 *
 * 개별 알림을 표시하는 컴포넌트입니다.
 * 확인/미확인(클릭 여부) 상태에 따라 시각적 차이를 둡니다.
 *
 * 참고: 뱃지 카운트는 read_at 기준, 개별 알림 표시는 clicked_at 기준
 *
 * 최적화 적용:
 * - 규칙 5.2: useCallback으로 핸들러 메모이제이션
 * - 규칙 5.1: React.memo에 props 비교 함수 추가
 * - 규칙 8.1: 복잡한 조건을 변수로 추출
 */

import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { formatter } from '@/shared/utils/formatter';
import type { NotificationItem } from '@/features/notifications';
import type { PushNotificationType } from '@/features/admin/api/adminPushApi';

// Notification Icons (통일된 viewBox 24x24)
import BellIcon from '@assets/icons/notification/bell.svg';
import PlayIcon from '@assets/icons/notification/play.svg';
import ChannelIcon from '@assets/icons/notification/channel.svg';
import GearIcon from '@assets/icons/notification/gear.svg';
import LightningIcon from '@assets/icons/notification/lightning.svg';
import PartyIcon from '@assets/icons/notification/party.svg';

const ICON_CONTAINER_SIZE = 40;
const ICON_SIZE = 24;

/** 아이콘 컴포넌트 타입 */
type IconComponent = React.FC<{ width: number; height: number; color: string }>;

/** 푸시 유형별 아이콘 매핑 */
const NOTIFICATION_ICONS: Record<PushNotificationType, IconComponent> = {
  new_content: PlayIcon,
  new_video: PlayIcon,
  content_update: PlayIcon,
  channel_update: ChannelIcon,
  system: GearIcon,
  marketing: LightningIcon,
  reminder: BellIcon,
  recommendation: PlayIcon,
  review: PartyIcon,
};

interface NotificationItemViewProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

function NotificationItemView({ item, onPress }: NotificationItemViewProps) {
  // 규칙 8.1: 복잡한 조건을 변수로 추출
  // 미확인 = 클릭하지 않은 알림 (clicked_at이 null)
  const isUnread = !item.clickedAt;
  const timeAgo = formatter.getDateDifferenceFromNow(item.createdAt);
  const iconColor = isUnread ? colors.main : colors.gray03;

  // 푸시 유형에 따른 아이콘 선택
  const IconComponent = NOTIFICATION_ICONS[item.notificationType] ?? BellIcon;

  // 규칙 5.2: useCallback으로 핸들러 메모이제이션
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Container onPress={handlePress} isUnread={isUnread}>
      <IconContainer isUnread={isUnread}>
        <IconComponent width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
      </IconContainer>
      <ContentContainer>
        <TitleText numberOfLines={1} isUnread={isUnread}>
          {item.title}
        </TitleText>
        <BodyText numberOfLines={2}>{item.body}</BodyText>
        <TimeText>{timeAgo}</TimeText>
      </ContentContainer>
      {isUnread && <UnreadDot />}
    </Container>
  );
}

/**
 * 규칙 5.1: React.memo에 적절한 비교 함수 추가
 * Named export로 통일하여 일관된 import 패턴 유지
 */
const MemoizedNotificationItemView = React.memo(NotificationItemView, (prevProps, nextProps) => {
  // item의 표시 필드를 모두 비교하여 UI 변경 시 리렌더링 보장
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;

  return (
    prevItem.id === nextItem.id &&
    prevItem.clickedAt === nextItem.clickedAt &&
    prevItem.title === nextItem.title &&
    prevItem.body === nextItem.body &&
    prevItem.createdAt === nextItem.createdAt &&
    prevItem.notificationType === nextItem.notificationType &&
    prevProps.onPress === nextProps.onPress
  );
});

export { MemoizedNotificationItemView as NotificationItemView };

/* Styled Components */

interface StyledProps {
  isUnread: boolean;
}

const Container = styled(Pressable)<StyledProps>(({ isUnread }) => ({
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: isUnread ? colors.gray07 : colors.black,
  gap: 12,
}));

const IconContainer = styled.View<StyledProps>(({ isUnread }) => ({
  width: ICON_CONTAINER_SIZE,
  height: ICON_CONTAINER_SIZE,
  borderRadius: ICON_CONTAINER_SIZE / 2,
  backgroundColor: isUnread ? colors.gray05 : colors.gray06,
  justifyContent: 'center',
  alignItems: 'center',
}));

const ContentContainer = styled.View({
  flex: 1,
  gap: 4,
});

const TitleText = styled.Text<StyledProps>(({ isUnread }) => ({
  ...textStyles.title2,
  color: isUnread ? colors.white : colors.gray02,
}));

const BodyText = styled.Text({
  ...textStyles.body3,
  color: colors.gray01,
});

const TimeText = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginTop: 2,
});

const UnreadDot = styled.View({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.main,
  marginTop: 4,
});
