/**
 * NotificationListHeader - 알림 목록 페이지 헤더
 *
 * BackButtonAppBar를 활용한 헤더 컴포넌트입니다.
 */

import React from 'react';
import { BackButtonAppBar } from '@/presentation/components/app-bar';

interface NotificationListHeaderProps {
  onGoBack: () => void;
}

/**
 * 알림 목록 헤더 컴포넌트
 * React.memo 적용 - props 변경 시에만 리렌더링
 */
const NotificationListHeader = React.memo(
  function NotificationListHeader({ onGoBack }: NotificationListHeaderProps) {
    return <BackButtonAppBar title="알림" onBackPress={onGoBack} />;
  },
  (prevProps, nextProps) => prevProps.onGoBack === nextProps.onGoBack,
);

export { NotificationListHeader };
