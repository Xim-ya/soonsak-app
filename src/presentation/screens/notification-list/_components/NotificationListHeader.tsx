/**
 * NotificationListHeader - 알림 목록 페이지 헤더
 *
 * BackButtonAppBar를 활용한 헤더 컴포넌트입니다.
 */

import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { BackButtonAppBar } from '@/presentation/components/app-bar';

interface NotificationListHeaderProps {
  onGoBack: () => void;
  onMarkAllAsRead: () => void;
  hasUnread: boolean;
}

function NotificationListHeader({
  onGoBack,
  onMarkAllAsRead,
  hasUnread,
}: NotificationListHeaderProps) {
  const actions = useMemo(
    () => [
      <MarkAllButton key="mark-all" onPress={onMarkAllAsRead} activeOpacity={0.7}>
        <MarkAllButtonText>모두 읽음</MarkAllButtonText>
      </MarkAllButton>,
    ],
    [onMarkAllAsRead],
  );

  return (
    <BackButtonAppBar title="알림" onBackPress={onGoBack} actions={hasUnread ? actions : []} />
  );
}

/* Styled Components */

const MarkAllButton = styled(TouchableOpacity)({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: colors.gray05,
});

const MarkAllButtonText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

export { NotificationListHeader };
