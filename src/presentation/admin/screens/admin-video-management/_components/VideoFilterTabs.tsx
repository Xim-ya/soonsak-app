/**
 * VideoFilterTabs - 비디오 상태 필터 탭
 *
 * 상태별 비디오 카운트와 함께 필터 탭을 표시합니다.
 */

import { memo, useCallback } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { ContentStatus } from '@/features/content/types';
import type { VideoStatusCounts } from '@/features/admin';

export type FilterStatus = ContentStatus | 'all';

interface FilterTab {
  key: FilterStatus;
  label: string;
  count: number;
}

interface VideoFilterTabsProps {
  readonly counts: VideoStatusCounts;
  readonly selectedStatus: FilterStatus;
  readonly onSelectStatus: (status: FilterStatus) => void;
}

export const VideoFilterTabs = memo(function VideoFilterTabs({
  counts,
  selectedStatus,
  onSelectStatus,
}: VideoFilterTabsProps) {
  const tabs: FilterTab[] = [
    { key: 'all', label: '전체', count: counts.total },
    { key: 'pending', label: '대기', count: counts.pending },
    { key: 'confirmed', label: '승인', count: counts.confirmed },
    { key: 'rejected', label: '거부', count: counts.rejected },
    { key: 'needs_review', label: '검토', count: counts.needsReview },
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
            isSelected={selectedStatus === tab.key}
            onPress={onSelectStatus}
          />
        ))}
      </ScrollView>
    </Container>
  );
});

interface TabItemProps {
  readonly tab: FilterTab;
  readonly isSelected: boolean;
  readonly onPress: (status: FilterStatus) => void;
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
