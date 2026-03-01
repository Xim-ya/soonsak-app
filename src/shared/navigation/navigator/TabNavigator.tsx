import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import type { SFSymbols7_0 } from 'sf-symbols-typescript';
import HomeScreen from '../../../presentation/screens/home/HomeScreen';
import ExploreScreen from '../../../presentation/screens/explore/ExploreScreen';
import ChannelScreen from '../../../presentation/screens/channel/ChannelScreen';
import MyScreen from '../../../presentation/screens/my/MyScreen';
import { TabConfig, TabRoutes } from '../constant/tabConfigs';
import { TabParamList } from '../types';
import colors from '@/shared/styles/colors';

// iOS 버전 체크
const IOS_VERSION = Platform.OS === 'ios' ? parseFloat(Platform.Version as string) : 0;
const IS_IOS_26_OR_LATER = IOS_VERSION >= 26;

// 상수 정의
const TAB_BAR_HEIGHT = 56;
const BLUR_INTENSITY = 80;

// SF Symbol 매핑 (iOS 26+ 네이티브 탭바용)
const SF_SYMBOLS: Record<TabRoutes, SFSymbols7_0> = {
  [TabRoutes.Home]: 'house.fill',
  [TabRoutes.Explore]: 'magnifyingglass',
  [TabRoutes.Channel]: 'play.tv.fill',
  [TabRoutes.My]: 'person.fill',
};

// 탭 라벨
const TAB_LABELS: Record<TabRoutes, string> = {
  [TabRoutes.Home]: '홈',
  [TabRoutes.Explore]: '탐색',
  [TabRoutes.Channel]: '채널',
  [TabRoutes.My]: 'MY',
};

const Tab = createBottomTabNavigator<TabParamList>();
const NativeTab = createNativeBottomTabNavigator<TabParamList>();

/**
 * 탭 바 배경 컴포넌트 (iOS 26 미만용)
 */
function TabBarBackground() {
  const isIOS = Platform.OS === 'ios';

  if (isIOS) {
    return <BlurView tint="dark" intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />;
  }

  return null;
}

/**
 * iOS 26+ 네이티브 탭 네비게이터
 * - Liquid Glass 플로팅 캡슐 탭바 자동 적용
 */
function NativeTabNavigator() {
  return (
    <NativeTab.Navigator
      tabBarActiveTintColor={colors.main}
      tabBarInactiveTintColor="#8E8E93"
      tabBarLabelStyle={{ fontSize: 10 }}
      minimizeBehavior="onScrollDown"
    >
      <NativeTab.Screen
        name={TabRoutes.Home}
        component={HomeScreen}
        options={{
          title: TAB_LABELS[TabRoutes.Home],
          tabBarIcon: () => ({ sfSymbol: SF_SYMBOLS[TabRoutes.Home], pointSize: 14 }),
        }}
      />
      <NativeTab.Screen
        name={TabRoutes.Explore}
        component={ExploreScreen}
        options={{
          title: TAB_LABELS[TabRoutes.Explore],
          tabBarIcon: () => ({ sfSymbol: SF_SYMBOLS[TabRoutes.Explore], pointSize: 14 }),
        }}
      />
      <NativeTab.Screen
        name={TabRoutes.Channel}
        component={ChannelScreen}
        options={{
          title: TAB_LABELS[TabRoutes.Channel],
          tabBarIcon: () => ({ sfSymbol: SF_SYMBOLS[TabRoutes.Channel], pointSize: 14 }),
        }}
      />
      <NativeTab.Screen
        name={TabRoutes.My}
        component={MyScreen}
        options={{
          title: TAB_LABELS[TabRoutes.My],
          tabBarIcon: () => ({ sfSymbol: SF_SYMBOLS[TabRoutes.My], pointSize: 14 }),
        }}
      />
    </NativeTab.Navigator>
  );
}

/**
 * 기존 탭 네비게이터 (iOS 26 미만, Android)
 */
function LegacyTabNavigator() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.main,
        tabBarInactiveTintColor: colors.gray03,
        tabBarLabel: ({ color }) => (
          <Text style={{ color, fontSize: 10 }}>{TabConfig[route.name as TabRoutes].label}</Text>
        ),
        tabBarIcon: ({ color, size }) => {
          const Icon = TabConfig[route.name as TabRoutes].icon;
          const iconSize = route.name === TabRoutes.Channel ? size - 2 : size;
          return <Icon width={iconSize} height={iconSize} color={color} fill={color} />;
        },
        tabBarStyle: {
          ...(isIOS && { position: 'absolute' as const }),
          backgroundColor: isIOS ? 'transparent' : colors.black,
          borderTopColor: isIOS ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: insets.bottom,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
        tabBarBackground: TabBarBackground,
      })}
    >
      <Tab.Screen name={TabRoutes.Home} component={HomeScreen} />
      <Tab.Screen name={TabRoutes.Explore} component={ExploreScreen} />
      <Tab.Screen name={TabRoutes.Channel} component={ChannelScreen} />
      <Tab.Screen name={TabRoutes.My} component={MyScreen} />
    </Tab.Navigator>
  );
}

/**
 * 탭 네비게이터
 * - iOS 26+: Liquid Glass 네이티브 탭바
 * - iOS 26 미만: BlurView 탭바
 * - Android: 기본 탭바
 */
export default function TabNavigator() {
  if (IS_IOS_26_OR_LATER) {
    return <NativeTabNavigator />;
  }

  return <LegacyTabNavigator />;
}
