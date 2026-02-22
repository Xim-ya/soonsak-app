/**
 * UserFilterTabs - 유저 역할 필터 탭
 *
 * 역할별 유저 카운트와 함께 필터 탭을 표시합니다.
 */

import { memo, useCallback } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { UserRoleCounts, UserRoleFilter } from '@/features/admin';

interface FilterTab {
  key: UserRoleFilter;
  label: string;
  count: number;
}

interface UserFilterTabsProps {
  readonly counts: UserRoleCounts;
  readonly selectedRole: UserRoleFilter;
  readonly onSelectRole: (role: UserRoleFilter) => void;
}

export const UserFilterTabs = memo(function UserFilterTabs({
  counts,
  selectedRole,
  onSelectRole,
}: UserFilterTabsProps) {
  const tabs: FilterTab[] = [
    { key: 'all', label: '전체', count: counts.total },
    { key: 'user', label: '일반', count: counts.user },
    { key: 'admin', label: '관리자', count: counts.admin },
    { key: 'banned', label: '차단', count: counts.banned },
  ];

  return (
    <Container>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isSelected={selectedRole === tab.key}
            onPress={onSelectRole}
          />
        ))}
      </ScrollView>
    </Container>
  );
});

interface TabItemProps {
  readonly tab: FilterTab;
  readonly isSelected: boolean;
  readonly onPress: (role: UserRoleFilter) => void;
}

const TabItem = memo(function TabItem({ tab, isSelected, onPress }: TabItemProps) {
  const handlePress = useCallback(() => {
    onPress(tab.key);
  }, [tab.key, onPress]);

  return (
    <TabButton onPress={handlePress} isSelected={isSelected} activeOpacity={0.7}>
      <TabLabel isSelected={isSelected}>{tab.label}</TabLabel>
      <TabCount isSelected={isSelected}>{tab.count}</TabCount>
    </TabButton>
  );
});

/* Styled Components */
const Container = styled.View({
  paddingVertical: AppSize.ratioHeight(12),
  backgroundColor: colors.black,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

interface TabButtonStyleProps {
  isSelected: boolean;
}

const TabButton = styled(TouchableOpacity)<TabButtonStyleProps>(({ isSelected }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: isSelected ? colors.primary : colors.gray06,
  gap: 6,
}));

const TabLabel = styled.Text<TabButtonStyleProps>(({ isSelected }) => ({
  ...textStyles.body2,
  color: isSelected ? colors.white : colors.gray02,
  fontWeight: isSelected ? '600' : '400',
}));

const TabCount = styled.Text<TabButtonStyleProps>(({ isSelected }) => ({
  ...textStyles.alert2,
  color: isSelected ? colors.white : colors.gray03,
  fontWeight: '500',
}));
