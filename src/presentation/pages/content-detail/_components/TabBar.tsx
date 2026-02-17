import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import { TabBarProps } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

interface TabItemProps {
  name: string;
  label: string;
  index: number;
  indexDecimal: SharedValue<number>;
  onPress: () => void;
}

const TabItem = ({ name, label, index, indexDecimal, onPress }: TabItemProps) => {
  const textStyle = useAnimatedStyle(() => {
    const isActive = Math.round(indexDecimal.value) === index;
    return {
      color: isActive ? colors.white : colors.gray04,
    };
  });

  return (
    <Tab key={name} onPress={onPress} activeOpacity={0.7}>
      <AnimatedTabText style={textStyle}>{label}</AnimatedTabText>
    </Tab>
  );
};

export const TabBar = <T extends string>({
  tabNames,
  indexDecimal,
  onTabPress,
  tabProps,
}: TabBarProps<T>) => {
  // 컴포넌트 내부에서 읽어 AppSize 갱신 반영
  const screenWidth = AppSize.screenWidth;
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
        {tabNames.map((name, index) => {
          const tabProp = tabProps?.[name as keyof typeof tabProps];
          const label = (tabProp as { label?: string })?.label || name;

          return (
            <TabItem
              key={name}
              name={name}
              label={label}
              index={index}
              indexDecimal={indexDecimal}
              onPress={() => onTabPress(name)}
            />
          );
        })}
      </TabsContainer>

      <Indicator style={indicatorStyle} width={indicatorWidth} />
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
