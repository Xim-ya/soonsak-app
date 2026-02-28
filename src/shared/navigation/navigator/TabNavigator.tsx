import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import HomeScreen from '../../../presentation/pages/home/HomePage';
import Explorepage from '../../../presentation/pages/explore/ExploreScreen';
import ChannelPage from '../../../presentation/pages/channel/ChannelPage';
import MyPage from '../../../presentation/pages/my/MyPage';
import { TabConfig, TabRoutes } from '../constant/tabConfigs';
import { TabParamList } from '../types';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import colors from '@/shared/styles/colors';

// 상수 정의
const TAB_BAR_HEIGHT = 56;
const BLUR_INTENSITY = 80;

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * 탭 바 배경 컴포넌트
 * - iOS 26+: Liquid Glass 사용
 * - iOS 26 미만: BlurView 사용
 * - Android: null (기본 배경색 사용)
 */
function TabBarBackground() {
  const { isSupported, LiquidGlassView } = useLiquidGlass();
  const isLiquidGlassEnabled = isSupported && LiquidGlassView;
  const isIOS = Platform.OS === 'ios';

  if (isLiquidGlassEnabled) {
    return <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />;
  }

  if (isIOS) {
    return <BlurView tint="dark" intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />;
  }

  return null;
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.main,
        tabBarInactiveTintColor: colors.gray03,
        tabBarLabel: ({ color }) => (
          <Text style={{ color }}>{TabConfig[route.name as TabRoutes].label}</Text>
        ),
        tabBarIcon: ({ color, size }) => {
          const Icon = TabConfig[route.name as TabRoutes].icon;
          const iconSize = route.name === TabRoutes.Channel ? size - 2 : size;
          return <Icon width={iconSize} height={iconSize} color={color} fill={color} />;
        },
        tabBarStyle: {
          ...(Platform.OS === 'ios' && { position: 'absolute' as const }),
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.black,
          borderTopColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: insets.bottom,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
        tabBarBackground: TabBarBackground,
      })}
    >
      <Tab.Screen name={TabRoutes.Home} component={HomeScreen} />
      <Tab.Screen name={TabRoutes.Explore} component={Explorepage} />
      <Tab.Screen name={TabRoutes.Channel} component={ChannelPage} />
      <Tab.Screen name={TabRoutes.My} component={MyPage} />
    </Tab.Navigator>
  );
}
