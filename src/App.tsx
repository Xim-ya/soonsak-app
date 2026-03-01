import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import StackNavigator from './shared/navigation/navigator/StackNavigator';
import '@/shared/extensions/arrayExtension';
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
import { DialogProvider } from '@/presentation/components/dialog';
import { isAppError } from '@/shared/errors';
import { linkingConfig } from '@/features/push-notifications';
import { navigationRef } from '@/shared/navigation/utils/navigationRef';
import { showGlobalSnackbar } from '@/shared/utils/snackbarRef';
import { configureGoogleSignin } from '@/features/auth/api/authApi';
import { useAppPreload } from '@/shared/hooks/useAppPreload';
import { useAppVersionCheck } from '@/features/app-config';
import { AppDialog } from '@/presentation/components/dialog/AppDialog';
import * as Clarity from '@microsoft/react-native-clarity';
import * as Sentry from '@sentry/react-native';

// Sentry 초기화 (앱 시작 시 가장 먼저 실행)
const SENTRY_DSN = process.env['EXPO_PUBLIC_SENTRY_DSN'];
const SENTRY_TRACES_SAMPLE_RATE = process.env['EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE'];
if (SENTRY_DSN) {
  // 프로덕션에서는 낮은 샘플링 비율 사용 (기본값 0.5), 개발 모드에서는 1.0
  const defaultSampleRate = __DEV__ ? 1.0 : 0.5;
  const tracesSampleRate = SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(SENTRY_TRACES_SAMPLE_RATE)
    : defaultSampleRate;

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: true,
    tracesSampleRate,
  });
}

// react-native-screens 활성화 (iOS 배경색 문제 해결을 위해)
enableScreens(true);

// Google Sign-In 초기화 (모듈 레벨에서 한 번만 호출)
const GOOGLE_WEB_CLIENT_ID = process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'];
const GOOGLE_IOS_CLIENT_ID = process.env['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'];

// 디버깅: 환경 변수 확인 (개발 모드에서만)
if (__DEV__) {
  console.log('[App] GOOGLE_WEB_CLIENT_ID:', GOOGLE_WEB_CLIENT_ID);
  console.log('[App] GOOGLE_IOS_CLIENT_ID:', GOOGLE_IOS_CLIENT_ID);
}

if (GOOGLE_WEB_CLIENT_ID) {
  configureGoogleSignin({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID && { iosClientId: GOOGLE_IOS_CLIENT_ID }),
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
function AppContent({
  showUpdateDialog,
  updateTitle,
  updateMessage,
  openStore,
  dismissDialog,
}: {
  showUpdateDialog: boolean;
  updateTitle: string;
  updateMessage: string;
  openStore: () => void;
  dismissDialog: () => void;
}) {
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

  // Microsoft Clarity 초기화 (프로덕션 빌드에서만 활성화)
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    const clarityProjectId = process.env['EXPO_PUBLIC_CLARITY_PROJECT_ID'];
    if (!clarityProjectId) {
      console.warn('[Clarity] 프로젝트 ID가 설정되지 않음');
      return;
    }

    try {
      Clarity.initialize(clarityProjectId, {
        logLevel: Clarity.LogLevel.None,
      });
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

      {/* 권장 업데이트 다이얼로그 (앱 진입 후 표시) */}
      <AppDialog
        visible={showUpdateDialog}
        title={updateTitle}
        description={updateMessage}
        isDivided
        leftButtonText="나중에"
        rightButtonText="업데이트"
        onLeftButtonPress={dismissDialog}
        onRightButtonPress={openStore}
        dismissOnBackdrop
        onBackdropPress={dismissDialog}
      />
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

  // 앱 버전 체크 (스플래시 상태에서 실행)
  const {
    isChecked: isVersionChecked,
    showDialog: showUpdateDialog,
    dialogTitle: updateTitle,
    dialogMessage: updateMessage,
    isForceUpdate,
    openStore,
    dismissDialog,
  } = useAppVersionCheck();

  // 스플래시 숨김 조건:
  // 1. 폰트 로드 완료
  // 2. 프리로드 완료
  // 3. 버전 체크 완료
  // 4. 강제 업데이트가 아닌 경우 (강제 업데이트 시 스플래시 유지)
  useEffect(() => {
    const shouldHideSplash = fontsLoaded && isPreloadReady && isVersionChecked && !isForceUpdate;
    if (shouldHideSplash) {
      hideSplash();
    }
  }, [fontsLoaded, isPreloadReady, isVersionChecked, isForceUpdate, hideSplash]);

  // 폰트 또는 프리로드 미완료 시 스플래시 유지
  if (!fontsLoaded || !isPreloadReady) {
    return null;
  }

  // 강제 업데이트: 스플래시 위에 다이얼로그만 표시 (앱 진입 차단)
  if (isForceUpdate && showUpdateDialog) {
    return (
      <AppDialog
        visible={showUpdateDialog}
        title={updateTitle}
        description={updateMessage}
        buttonText="업데이트"
        onButtonPress={openStore}
        dismissOnBackdrop={false}
      />
    );
  }

  // 버전 체크 미완료 시 대기 (스플래시 유지)
  if (!isVersionChecked) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.black }}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>
            <DialogProvider>
              <ContentFilterProvider>
                <AppContent
                  showUpdateDialog={showUpdateDialog && !isForceUpdate}
                  updateTitle={updateTitle}
                  updateMessage={updateMessage}
                  openStore={openStore}
                  dismissDialog={dismissDialog}
                />
              </ContentFilterProvider>
            </DialogProvider>
          </SnackbarProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
