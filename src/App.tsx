import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import StackNavigator from './shared/navigation/navigator/StackNavigator';
import '@/shared/exntensions/arrayExtension';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AppSize } from '@/shared/utils/appSize';
import colors from '@/shared/styles/colors';
import { enableScreens } from 'react-native-screens';
import { AuthProvider } from '@/shared/providers/AuthProvider';
import { PushNotificationProvider } from '@/shared/providers/PushNotificationProvider';
import { ContentFilterProvider } from '@/shared/context/ContentFilterContext';
import { SnackbarProvider } from '@/shared/providers/SnackbarProvider';
import { isAppError } from '@/shared/errors';
import { linkingConfig } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
import { showGlobalSnackbar } from '@/shared/utils/snackbarRef';
import { configureGoogleSignin } from '@/features/auth/api/authApi';
import { useAppPreload } from '@/shared/hooks/useAppPreload';
import * as Clarity from '@microsoft/react-native-clarity';

// react-native-screens 활성화 (iOS 배경색 문제 해결을 위해)
enableScreens(true);

// Google Sign-In 초기화 (모듈 레벨에서 한 번만 호출)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// 디버깅: 환경 변수 확인 (개발 모드에서만)
if (__DEV__) {
  console.log('[App] GOOGLE_WEB_CLIENT_ID:', GOOGLE_WEB_CLIENT_ID);
  console.log('[App] GOOGLE_IOS_CLIENT_ID:', GOOGLE_IOS_CLIENT_ID);
}

if (GOOGLE_WEB_CLIENT_ID) {
  configureGoogleSignin({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
}

// 개발 모드에서 YouTube API 테스트 비활성화 (성능 최적화)
// if (__DEV__) {
//   import('@/utils/youtube/testYoutube');
// }

// React Query Client 생성 (컴포넌트 밖에서 생성)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1분간 fresh 상태 유지
      gcTime: 15 * 60000, // 15분간 캐시 유지 (v5에서 cacheTime -> gcTime)
      retry: 1,
      refetchOnWindowFocus: false, // 모바일에서는 필요 없음
    },
  },
  // 전역 Query 에러 핸들러
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 개별 쿼리에서 전역 에러 핸들러 스킵 요청 시
      if (query.meta?.['skipGlobalErrorHandler']) {
        return;
      }

      // 사용자 취소는 스낵바 표시하지 않음
      if (isAppError(error) && error.isUserCancelled) {
        return;
      }

      // 에러 메시지 표시
      const message = isAppError(error) ? error.userMessage : '오류가 발생했습니다';
      showGlobalSnackbar(message);

      // 개발 모드에서 콘솔 로그
      if (__DEV__) {
        console.error('[QueryCache Error]', message, error);
      }
    },
  }),
  // 전역 Mutation 에러 핸들러
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // 개별 뮤테이션에서 전역 에러 핸들러 스킵 요청 시
      if (mutation.meta?.['skipGlobalErrorHandler']) {
        return;
      }

      // 사용자 취소는 스낵바 표시하지 않음
      if (isAppError(error) && error.isUserCancelled) {
        return;
      }

      // 에러 메시지 표시
      const message = isAppError(error) ? error.userMessage : '오류가 발생했습니다';
      showGlobalSnackbar(message);

      // 개발 모드에서 콘솔 로그
      if (__DEV__) {
        console.error('[MutationCache Error]', message, error);
      }
    },
  }),
});

// 네비게이션 테마 설정 (iOS 엣지 하얀색 배경 문제 해결)
const navigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.main,
    background: colors.black,
    card: colors.black,
    text: colors.white,
    border: colors.black,
    notification: colors.main,
  },
};

// AppSize 초기화를 위한 내부 컴포넌트
function AppContent() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // AppSize 초기화
    AppSize.init(insets);
    console.log('AppSize 초기화', AppSize);

    // 앱 종료 시 정리
    return () => {
      AppSize.destroy();
    };
  }, [insets]);

  // Microsoft Clarity 초기화
  useEffect(() => {
    const clarityProjectId = process.env['EXPO_PUBLIC_CLARITY_PROJECT_ID'];
    if (!clarityProjectId) {
      console.warn('[Clarity] 프로젝트 ID가 설정되지 않음');
      return;
    }

    try {
      console.log('[Clarity] 초기화 시작...');
      Clarity.initialize(clarityProjectId, {
        logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.None,
      });
      console.log('[Clarity] 초기화 완료');
    } catch (error) {
      console.error('[Clarity] 초기화 실패:', error);
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <PushNotificationProvider>
          <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linkingConfig}>
            <StackNavigator />
          </NavigationContainer>
        </PushNotificationProvider>
      </AuthProvider>
    </>
  );
}

export default function App() {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const [fontsLoaded] = useFonts({
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    staatliches_regular: require('../assets/fonts/Staatliches-Regular.ttf'),
    'DoHyeon-Regular': require('../assets/fonts/DoHyeon-Regular.ttf'),
  });
  /* eslint-enable @typescript-eslint/no-require-imports */

  const { isReady: isPreloadReady, hideSplash } = useAppPreload();

  // 폰트 + 이미지 프리로드 완료 시 스플래시 숨김
  useEffect(() => {
    if (fontsLoaded && isPreloadReady) {
      hideSplash();
    }
  }, [fontsLoaded, isPreloadReady, hideSplash]);

  // 폰트 또는 프리로드 미완료 시 스플래시 유지
  if (!fontsLoaded || !isPreloadReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.black }}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>
            <ContentFilterProvider>
              <AppContent />
            </ContentFilterProvider>
          </SnackbarProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
