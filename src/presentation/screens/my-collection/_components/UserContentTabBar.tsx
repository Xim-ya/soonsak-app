import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import styled from '@emotion/native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { type TabBarProps, useFocusedTab } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { analyticsService, type MyCollectionTab } from '@/shared/analytics';

const { width: screenWidth } = Dimensions.get('window');

interface TabItemProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

/**
 * TabItem - 개별 탭 아이템 컴포넌트
 */
const TabItem = memo(function TabItem({ name, isActive, onPress }: TabItemProps) {
  return (
    <Tab onPress={onPress} activeOpacity={0.7}>
      <TabText isActive={isActive}>{name}</TabText>
    </Tab>
  );
});

/**
 * UserContentTabBar - 사용자 콘텐츠 목록 탭바
 *
 * ContentDetail의 TabBar와 동일한 디자인을 사용합니다.
 * 애니메이션 인디케이터와 함께 탭 전환을 처리합니다.
 */
export function UserContentTabBar<T extends string>({
  tabNames,
  indexDecimal,
  onTabPress,
}: TabBarProps<T>) {
  // 라이브러리에서 현재 포커스된 탭 가져오기
  const focusedTab = useFocusedTab();

  // 플리커링 방지를 위해 자체 상태 관리 (iOS/Android 공통)
  // lazy initializer로 초기값 설정 (initialTabName으로 진입 시)
  const [activeTab, setActiveTab] = useState<T>(() => (focusedTab as T) || tabNames[0]!);

  // focusedTab 변경 시 동기화
  useEffect(() => {
    if (focusedTab && focusedTab !== activeTab) {
      setActiveTab(focusedTab as T);
    }
  }, [focusedTab]);

  // 탭 이름을 analytics 타입으로 변환
  const toTabType = (name: string): MyCollectionTab => {
    if (name === '찜했어요') return 'favorites';
    if (name === '평가했어요') return 'ratings';
    return 'watched';
  };

  // 화면 진입 시 초기 탭 로깅 (최초 1회만)
  const hasLoggedViewRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedViewRef.current && activeTab) {
      hasLoggedViewRef.current = true;
      analyticsService.myCollectionView({
        initial_tab: toTabType(activeTab),
      });
    }
  }, [activeTab]);

  const handleTabPress = useCallback(
    (name: T) => {
      // 탭 변경 이벤트 로깅
      analyticsService.myCollectionTabChange({
        tab_name: toTabType(name),
      });

      setActiveTab(name);
      onTabPress(name);
    },
    [onTabPress],
  );

  const getIsActive = (name: T) => activeTab === name;

  const tabWidth = screenWidth / tabNames.length;
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

  return (
    <TabBarContainer>
      <TabsContainer>
        {tabNames.map((name) => (
          <TabItem
            key={name}
            name={name}
            isActive={getIsActive(name)}
            onPress={() => handleTabPress(name)}
          />
        ))}
      </TabsContainer>
      <Indicator style={indicatorStyle} width={indicatorWidth} />
    </TabBarContainer>
  );
}

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
