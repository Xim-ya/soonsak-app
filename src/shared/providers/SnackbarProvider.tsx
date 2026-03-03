import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/native';
import { Animated, Platform } from 'react-native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { setSnackbarRef } from '@/shared/utils/snackbarRef';

/**
 * SnackbarProvider - 전역 스낵바 컴포넌트
 *
 * 앱 전역에서 에러/성공 메시지를 표시하는 스낵바입니다.
 * QueryClient의 전역 에러 핸들러와 연동되어 자동으로 에러를 표시합니다.
 *
 * @example
 * // App.tsx에서 사용
 * <QueryClientProvider client={queryClient}>
 *   <SnackbarProvider>
 *     <AppContent />
 *   </SnackbarProvider>
 * </QueryClientProvider>
 */

type SnackbarType = 'error' | 'success' | 'info';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

const SNACKBAR_DURATION = 720;
const ANIMATION_DURATION = 300;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'error',
  });

  const translateY = useRef(new Animated.Value(100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 스낵바 숨김 함수
  const hideSnackbar = useRef(() => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    });
  }).current;

  // 스낵바 표시 함수
  const showSnackbar = useRef((message: string, type: SnackbarType) => {
    // 기존 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSnackbar({ visible: true, message, type });

    // 애니메이션: 아래에서 위로 슬라이드
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    // 자동 숨김
    timeoutRef.current = setTimeout(() => {
      hideSnackbar();
    }, SNACKBAR_DURATION);
  }).current;

  // 전역 참조 설정
  useEffect(() => {
    setSnackbarRef({
      showError: (message: string) => showSnackbar(message, 'error'),
      showSuccess: (message: string) => showSnackbar(message, 'success'),
      showInfo: (message: string) => showSnackbar(message, 'info'),
    });

    return () => {
      setSnackbarRef(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showSnackbar]);

  return (
    <>
      {children}
      {snackbar.visible && (
        <SnackbarContainer style={{ transform: [{ translateY }] }}>
          <SnackbarContent type={snackbar.type}>
            <SnackbarMessage>{snackbar.message}</SnackbarMessage>
          </SnackbarContent>
        </SnackbarContainer>
      )}
    </>
  );
}

/* Styled Components */

// 안드로이드 네비게이션 바 높이 (일반적으로 48dp)
const ANDROID_NAV_BAR_HEIGHT = 48;

const SnackbarContainer = styled(Animated.View)({
  position: 'absolute',
  bottom: Platform.select({
    ios: AppSize.bottomInset + 12,
    // Android: 실제 inset 사용, 없으면 기본 네비게이션 바 높이로 fallback
    android: Math.max(AppSize.bottomInset, ANDROID_NAV_BAR_HEIGHT) + 12,
  }),
  left: AppSize.ratioWidth(16),
  right: AppSize.ratioWidth(16),
  zIndex: 9999,
  ...Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
});

const getSnackbarColor = (type: SnackbarType): string => {
  switch (type) {
    case 'error':
      return '#E53E3E';
    case 'success':
      return '#38A169';
    case 'info':
      return colors.gray04;
    default:
      return colors.gray04;
  }
};

const SnackbarContent = styled.View<{ type: SnackbarType }>(({ type }) => ({
  backgroundColor: getSnackbarColor(type),
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}));

const SnackbarMessage = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  textAlign: 'center',
});
