import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp, useNavigationState } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import ContentDetailPage from '../../../presentation/pages/content-detail/ContentDetailPage';
import { PlayerPage } from '../../../presentation/pages/player/PlayerPage';
import ChannelDetailPage from '../../../presentation/pages/channel-detail/ChannelDetailPage';
import SearchPage from '../../../presentation/pages/search/SearchPage';
import ChannelSelectionPage from '../../../presentation/pages/channel-selection/ChannelSelectionPage';
import { MediaListPage } from '../../../presentation/pages/media/MediaListPage';
import { ImageDetailPage } from '../../../presentation/pages/media/ImageDetailPage';
import LoginPage from '../../../presentation/pages/login/LoginPage';
import ProfileSetupPage from '../../../presentation/pages/profile-setup/ProfileSetupPage';
import SettingsPage from '../../../presentation/pages/settings/SettingsPage';
import UserContentListPage from '../../../presentation/pages/user-content-list/UserContentListPage';
import QuickExplorePage from '../../../presentation/pages/quickExplore/QuickExplorePage';
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
        component={LoginPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.contentDetail}
        component={ContentDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.player}
        component={PlayerPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.channelDetail}
        component={ChannelDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.search}
        component={SearchPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.channelSelection}
        component={ChannelSelectionPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.mediaList}
        component={MediaListPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.imageDetail}
        component={ImageDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.profileSetup}
        component={ProfileSetupPage}
        options={({ route }) => ({
          headerShown: false,
          // 초기 설정 모드에서만 뒤로가기 제스처 비활성화
          gestureEnabled: route.params?.mode !== 'initial',
        })}
      />
      <Stack.Screen
        name={routePages.settings}
        component={SettingsPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.userContentList}
        component={UserContentListPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routePages.quickExplore}
        component={QuickExplorePage}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
