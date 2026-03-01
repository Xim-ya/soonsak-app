import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp, useNavigationState } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import ContentDetailScreen from '../../../presentation/screens/content-detail/ContentDetailScreen';
import { PlayerScreen } from '../../../presentation/screens/player/PlayerScreen';
import ChannelDetailScreen from '../../../presentation/screens/channel-detail/ChannelDetailScreen';
import SearchScreen from '../../../presentation/screens/search/SearchScreen';
import ChannelSelectionScreen from '../../../presentation/screens/channel-selection/ChannelSelectionScreen';
import ChannelAllScreen from '../../../presentation/screens/channel-all/ChannelAllScreen';
import { MediaListScreen } from '../../../presentation/screens/media/MediaListScreen';
import { ImageDetailScreen } from '../../../presentation/screens/media/ImageDetailScreen';
import LoginScreen from '../../../presentation/screens/login/LoginScreen';
import ProfileSetupScreen from '../../../presentation/screens/profile-setup/ProfileSetupScreen';
import SettingsScreen from '../../../presentation/screens/settings/SettingsScreen';
import UserContentListScreen from '../../../presentation/screens/user-content-list/UserContentListScreen';
import WatchHistoryScreen from '../../../presentation/screens/watch-history/WatchHistoryScreen';
import QuickExploreScreen from '../../../presentation/screens/quickExplore/QuickExploreScreen';
import AdminContentSearchScreen from '../../../presentation/admin/screens/admin-content-search/AdminContentSearchScreen';
import AdminPrimaryVideoSelectScreen from '../../../presentation/admin/screens/admin-primary-video-select/AdminPrimaryVideoSelectScreen';
import AdminVideoManagementScreen from '../../../presentation/admin/screens/admin-video-management/AdminVideoManagementScreen';
import AdminUserManagementScreen from '../../../presentation/admin/screens/admin-user-management/AdminUserManagementScreen';
import AdminUserDetailScreen from '../../../presentation/admin/screens/admin-user-detail/AdminUserDetailScreen';
import AdminPushContentSelectScreen from '../../../presentation/admin/screens/admin-push-content-select/AdminPushContentSelectScreen';
import AdminUserContentListScreen from '../../../presentation/admin/screens/admin-user-content-list/AdminUserContentListScreen';
import AdminContentRegistrationScreen from '../../../presentation/admin/screens/admin-content-registration/AdminContentRegistrationScreen';
import AdminChannelManagementScreen from '../../../presentation/admin/screens/admin-channel-management/AdminChannelManagementScreen';
import AdminChannelDetailScreen from '../../../presentation/admin/screens/admin-channel-detail/AdminChannelDetailScreen';
import { RootStackParamList } from '../types';
import { routePages } from '../constant/routePages';
import { AuthGuard } from '../guards/AuthGuard';
import colors from '@/shared/styles/colors';
import { useAuth } from '@/shared/providers/AuthProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * ProfileSetupNavigator - 신규 사용자 프로필 설정 플로우 처리
 *
 * needsProfileSetup이 true면 ProfileSetupPage로 이동합니다.
 */
function ProfileSetupNavigator(): null {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { needsProfileSetup, status } = useAuth();

  // 현재 최상위 라우트 이름 가져오기
  const currentRouteName = useNavigationState((state) => {
    const routes = state?.routes;
    return routes?.[routes.length - 1]?.name;
  });

  useEffect(() => {
    // 이미 ProfileSetupPage에 있으면 네비게이션하지 않음
    const isOnProfileSetup = currentRouteName === routePages.profileSetup;

    // 인증됨 + 프로필 설정 필요 + ProfileSetupPage가 아닐 때만 이동
    // 스택을 리셋하지 않고 ProfileSetup을 push하여 이전 화면 정보 유지
    if (status === 'authenticated' && needsProfileSetup && !isOnProfileSetup) {
      navigation.navigate(routePages.profileSetup, { mode: 'initial' });
    }
  }, [needsProfileSetup, status, currentRouteName, navigation]);

  return null;
}

/**
 * StackNavigator - 메인 네비게이션
 *
 * - status === 'idle': 세션 복원 중 → null 반환 (스플래시 대기)
 * - 그 외: 메인 스크린 스택 표시 (비회원/회원 모두 접근 가능)
 *
 * 로그인 화면은 메인 스택 위에 모달로 표시됩니다.
 */
export default function StackNavigator() {
  const { status } = useAuth();

  // 세션 복원 중
  if (status === 'idle') {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.black },
        animation: 'default',
      }}
    >
      <Stack.Screen name={routePages.mainTabs} options={{ headerShown: false }}>
        {() => (
          <>
            <AuthGuard />
            <ProfileSetupNavigator />
            <TabNavigator />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={routePages.login}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.contentDetail}
        component={ContentDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.player}
        component={PlayerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.channelDetail}
        component={ChannelDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.search}
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.channelSelection}
        component={ChannelSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.channelAll}
        component={ChannelAllScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.mediaList}
        component={MediaListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.imageDetail}
        component={ImageDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.profileSetup}
        component={ProfileSetupScreen}
        options={({ route }) => ({
          headerShown: false,
          // 초기 설정 모드에서만 뒤로가기 제스처 비활성화
          gestureEnabled: route.params?.mode !== 'initial',
        })}
      />
      <Stack.Screen
        name={routePages.settings}
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.userContentList}
        component={UserContentListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.watchHistory}
        component={WatchHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.quickExplore}
        component={QuickExploreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminContentSearch}
        component={AdminContentSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminPrimaryVideoSelect}
        component={AdminPrimaryVideoSelectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminVideoManagement}
        component={AdminVideoManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminUserManagement}
        component={AdminUserManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminUserDetail}
        component={AdminUserDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminPushContentSelect}
        component={AdminPushContentSelectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminUserContentList}
        component={AdminUserContentListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminContentRegistration}
        component={AdminContentRegistrationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminChannelManagement}
        component={AdminChannelManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.adminChannelDetail}
        component={AdminChannelDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
