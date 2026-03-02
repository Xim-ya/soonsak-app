/**
 * NotificationBellButton - 알림 벨 아이콘 버튼
 *
 * 알림 아이콘과 읽지 않은 알림 개수 뱃지를 표시합니다.
 * 클릭 시 알림 목록 페이지로 이동합니다.
 * 로그인한 사용자에게만 표시됩니다.
 *
 * 최적화 적용:
 * - 규칙 5.1: 단순한 계산에 불필요한 useMemo 제거
 * - 규칙 5.2: useCallback으로 핸들러 메모이제이션
 * - 규칙 8.2: 매직 넘버 상수로 분리
 */

import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import BellIcon from '@assets/icons/bell.svg';

// 규칙 8.2: 매직 넘버를 상수로 분리
const DEFAULT_ICON_SIZE = 24;
const BADGE_RATIO = 0.65; // 아이콘 대비 뱃지 크기 비율
const MAX_BADGE_COUNT = 99;
const HIT_SLOP = 12;

interface NotificationBellButtonProps {
  /** 아이콘 색상 */
  color?: string;
  /** 아이콘 크기 */
  size?: number;
}

/**
 * 알림 벨 버튼 컴포넌트
 * React.memo 적용 - props 변경 시에만 리렌더링
 */
const NotificationBellButton = React.memo(
  function NotificationBellButton({
    color = colors.white,
    size = DEFAULT_ICON_SIZE,
  }: NotificationBellButtonProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { status } = useAuth();
    const isAuthenticated = status === 'authenticated';

    const { data: unreadData } = useUnreadNotificationCount({
      enabled: isAuthenticated,
    });

    // 규칙 5.1: 단순한 계산은 일반 변수로 처리 (useMemo 불필요)
    const unreadCount = unreadData?.count ?? 0;
    const hasUnread = unreadCount > 0;
    const displayCount =
      unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount.toString();

    // 뱃지 크기를 아이콘 크기에 비례하여 계산
    const badgeSize = Math.round(size * BADGE_RATIO);
    const badgeFontSize = Math.round(badgeSize * 0.6);

    // 규칙 5.2: useCallback으로 핸들러 메모이제이션
    const handlePress = useCallback(() => {
      navigation.navigate(routePages.notificationList);
    }, [navigation]);

    // 비로그인 사용자에게는 표시하지 않음 (조건부 렌더링은 hooks 호출 후에)
    if (!isAuthenticated) {
      return null;
    }

    return (
      <Container
        onPress={handlePress}
        hitSlop={HIT_SLOP}
        accessibilityLabel="알림"
        accessibilityRole="button"
        accessibilityState={{ selected: hasUnread }}
      >
        <BellIcon width={size} height={size} color={color} />
        {hasUnread && (
          <Badge size={badgeSize}>
            <BadgeText fontSize={badgeFontSize}>{displayCount}</BadgeText>
          </Badge>
        )}
      </Container>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.color === nextProps.color && prevProps.size === nextProps.size;
  },
);

export { NotificationBellButton };

/* Styled Components */

const Container = styled(Pressable)({
  position: 'relative',
  padding: 4,
});

const Badge = styled.View<{ size: number }>(({ size }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  minWidth: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 2,
}));

const BadgeText = styled.Text<{ fontSize: number }>(({ fontSize }) => ({
  fontSize,
  lineHeight: fontSize * 1.2,
  color: colors.white,
  fontWeight: '600',
}));
