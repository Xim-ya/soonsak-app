import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../../presentation/pages/home/HomePage';
import { Text } from 'react-native';
import { TabConfig, TabRoutes } from '../constant/tabConfigs';
import Explorepage from '../../../presentation/pages/explore/ExploreScreen';
import ChannelPage from '../../../presentation/pages/channel/ChannelPage';
import MyPage from '../../../presentation/pages/my/MyPage';
import { TabParamList } from '../types';
import colors from '@/shared/styles/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.main,
        tabBarInactiveTintColor: colors.gray04,
        tabBarLabel: ({ color }) => {
          return <Text style={{ color }}>{TabConfig[route.name as TabRoutes].label}</Text>;
        },
        tabBarIcon: ({ color, size }) => {
          const Icon = TabConfig[route.name as TabRoutes].icon;
          // 채널 아이콘만 약간 작게
          const iconSize = route.name === TabRoutes.Channel ? size - 2 : size;
          return <Icon width={iconSize} height={iconSize} color={color} fill={color} />;
        },
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopColor: colors.gray05,
          // Android에서 하단 시스템 네비게이션 바 영역 확보
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
      })}
    >
      <Tab.Screen name={TabRoutes.Home} component={HomeScreen} />
      <Tab.Screen name={TabRoutes.Explore} component={Explorepage} />
      <Tab.Screen name={TabRoutes.Channel} component={ChannelPage} />
      <Tab.Screen name={TabRoutes.My} component={MyPage} />
    </Tab.Navigator>
  );
}
