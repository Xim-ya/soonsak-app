/**
 * RegistrationTabBar - 등록 탭 바
 *
 * 영상 추가 / 채널 추가 탭을 전환합니다.
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { RegistrationTab } from '../_hooks/useContentRegistration';

interface RegistrationTabBarProps {
  readonly activeTab: RegistrationTab;
  readonly onTabChange: (tab: RegistrationTab) => void;
}

const TABS: Array<{ key: RegistrationTab; label: string }> = [
  { key: 'video', label: '영상 추가' },
  { key: 'channel', label: '채널 추가' },
];

function RegistrationTabBarComponent({ activeTab, onTabChange }: RegistrationTabBarProps) {
  const handleTabPress = useCallback(
    (tab: RegistrationTab) => {
      if (tab !== activeTab) {
        onTabChange(tab);
      }
    },
    [activeTab, onTabChange],
  );

  return (
    <Container>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TabButton
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
            isActive={isActive}
          >
            <TabText isActive={isActive}>{tab.label}</TabText>
          </TabButton>
        );
      })}
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 16,
  backgroundColor: colors.gray06,
  borderRadius: 10,
  padding: 4,
});

const TabButton = styled(TouchableOpacity)<{ isActive: boolean }>(({ isActive }) => ({
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  backgroundColor: isActive ? colors.gray04 : 'transparent',
}));

const TabText = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...textStyles.body1,
  color: isActive ? colors.white : colors.gray02,
}));

export const RegistrationTabBar = memo(RegistrationTabBarComponent);
