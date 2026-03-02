import { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { TabBarProps, useFocusedTab } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

interface TabItemProps {
  name: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = ({ name, label, isActive, onPress }: TabItemProps) => {
  return (
    <Tab key={name} onPress={onPress} activeOpacity={0.7}>
      <TabText isActive={isActive}>{label}</TabText>
    </Tab>
  );
};

/** 태블릿 탭바 레이아웃 상수 */
const TABLET_TAB_MAX_WIDTH = 600;

export const TabBar = <T extends string>({
  tabNames,
  indexDecimal,
  onTabPress,
  tabProps,
}: TabBarProps<T>) => {
  // 라이브러리에서 현재 포커스된 탭 가져오기 (초기값용)
  const focusedTab = useFocusedTab();

  // 플리커링 방지를 위해 자체 상태 관리 (iOS/Android 공통)
  // lazy initializer로 초기값 설정
  const [activeTab, setActiveTab] = useState<T>(() => (focusedTab as T) || tabNames[0]!);

  // focusedTab 변경 시 동기화
  useEffect(() => {
    if (focusedTab && focusedTab !== activeTab) {
      setActiveTab(focusedTab as T);
    }
  }, [focusedTab]);

  const handleTabPress = useCallback(
    (name: T) => {
      setActiveTab(name);
      onTabPress(name);
    },
    [onTabPress],
  );

  // 컴포넌트 내부에서 읽어 AppSize 갱신 반영
  const isLargeScreen = AppSize.isLargeScreen();
  const screenWidth = isLargeScreen ? AppSize.actualScreenWidth : AppSize.screenWidth;
  // 태블릿에서는 탭바 max-width 적용
  const effectiveWidth = isLargeScreen ? Math.min(screenWidth, TABLET_TAB_MAX_WIDTH) : screenWidth;
  const tabWidth = effectiveWidth / tabNames.length;
  const indicatorWidth = tabWidth * 0.38;

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      indexDecimal.value,
      tabNames.map((_, i) => i),
      tabNames.map((_, i) => i * tabWidth + (tabWidth - indicatorWidth) / 2),
    );

    return {
      transform: [{ translateX }],
    };
  });

  // 태블릿 중앙 정렬 스타일
  const tabletContainerStyle = isLargeScreen ? { alignItems: 'center' as const } : undefined;
  const tabletTabsStyle = isLargeScreen ? { width: effectiveWidth } : undefined;

  const getIsActive = (name: T) => activeTab === name;

  return (
    <TabBarContainer style={tabletContainerStyle}>
      <TabsContainer style={tabletTabsStyle}>
        {tabNames.map((name, index) => {
          const tabProp = tabProps?.[name as keyof typeof tabProps];
          const label = (tabProp as { label?: string })?.label || name;

          return (
            <TabItem
              key={name}
              name={name}
              label={label}
              isActive={getIsActive(name)}
              onPress={() => handleTabPress(name)}
            />
          );
        })}
        {/* 인디케이터를 TabsContainer 안에 배치하여 중앙 정렬 대응 */}
        <Indicator style={indicatorStyle} width={indicatorWidth} />
      </TabsContainer>
    </TabBarContainer>
  );
};

/* Styled Components */
const TabBarContainer = styled.View({
  backgroundColor: colors.black,
  borderBottomWidth: 0.75,
  borderBottomColor: colors.gray06,
  position: 'relative',
});

const TabsContainer = styled.View({
  flexDirection: 'row',
  height: 48,
  position: 'relative',
});

const Tab = styled(TouchableOpacity)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const TabText = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...textStyles.body3,
  color: isActive ? colors.white : colors.gray04,
}));

const Indicator = styled(Animated.View)<{ width: number }>(({ width }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width,
  height: 2,
  backgroundColor: colors.main,
}));
