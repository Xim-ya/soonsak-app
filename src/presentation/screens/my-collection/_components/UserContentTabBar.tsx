import React, { memo } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import styled from '@emotion/native';
import Animated, { useAnimatedStyle, interpolate, type SharedValue } from 'react-native-reanimated';
import type { TabBarProps } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

const { width: screenWidth } = Dimensions.get('window');

interface TabItemProps {
  name: string;
  index: number;
  indexDecimal: SharedValue<number>;
  onPress: () => void;
}

/**
 * TabItem - 개별 탭 아이템 컴포넌트
 *
 * useAnimatedStyle을 컴포넌트 레벨에서 사용하기 위해 분리
 */
const TabItem = memo(function TabItem({ name, index, indexDecimal, onPress }: TabItemProps) {
  const textStyle = useAnimatedStyle(() => {
    const isActive = Math.round(indexDecimal.value) === index;
    return {
      color: isActive ? colors.white : colors.gray04,
    };
  });

  return (
    <Tab onPress={onPress} activeOpacity={0.7}>
      <AnimatedTabText style={textStyle}>{name}</AnimatedTabText>
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
        {tabNames.map((name, index) => (
          <TabItem
            key={name}
            name={name}
            index={index}
            indexDecimal={indexDecimal}
            onPress={() => onTabPress(name)}
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

const AnimatedTabText = styled(Animated.Text)({
  ...textStyles.body3,
});

const Indicator = styled(Animated.View)<{ width: number }>(({ width }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width,
  height: 2,
  backgroundColor: colors.main,
}));
