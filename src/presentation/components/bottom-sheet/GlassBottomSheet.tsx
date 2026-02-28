/**
 * GlassBottomSheet - iOS 18+ 스타일 글래스모피즘 바텀시트
 *
 * iOS 18에서 도입된 글래스 효과 바텀시트를 구현합니다.
 * - iOS: expo-blur를 활용한 네이티브 blur + vibrancy 효과
 * - Android: fallback으로 반투명 배경 사용
 * - React Native Reanimated 기반 부드러운 애니메이션
 *
 * @example
 * ```tsx
 * <GlassBottomSheet
 *   visible={isVisible}
 *   onClose={handleClose}
 *   title="옵션 선택"
 * >
 *   <MenuItem onPress={handleOption1}>옵션 1</MenuItem>
 *   <MenuItem onPress={handleOption2}>옵션 2</MenuItem>
 * </GlassBottomSheet>
 * ```
 */

import React, { useCallback, useEffect, ReactNode } from 'react';
import { Modal, Platform } from 'react-native';
import styled from '@emotion/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

// 타입 정의
interface GlassBottomSheetProps {
  /** 바텀시트 표시 여부 */
  readonly visible: boolean;
  /** 닫기 콜백 */
  readonly onClose: () => void;
  /** 바텀시트 제목 (옵션) */
  readonly title?: string;
  /** 자식 컴포넌트 */
  readonly children: ReactNode;
  /** 최소 높이 (기본: 200) */
  readonly minHeight?: number;
  /** 최대 높이 비율 (0-1, 기본: 0.9) */
  readonly maxHeightRatio?: number;
  /** blur 강도 (기본: 80) */
  readonly blurIntensity?: number;
  /** 드래그로 닫기 활성화 (기본: true) */
  readonly enableDragToClose?: boolean;
}

// 상수 정의
const HEADER_HEIGHT = 56;
const HANDLE_HEIGHT = 24;
const ANIMATION_CONFIG = {
  duration: 350,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};
const SPRING_CONFIG = {
  damping: 25,
  stiffness: 300,
};
const BORDER_RADIUS = 24;

function GlassBottomSheet({
  visible,
  onClose,
  title,
  children,
  minHeight = 200,
  maxHeightRatio = 0.9,
  blurIntensity = 80,
  enableDragToClose = true,
}: GlassBottomSheetProps) {
  // 화면 높이 계산
  const screenHeight = AppSize.screenHeight;
  const maxHeight = screenHeight * maxHeightRatio;
  const sheetHeight = Math.max(minHeight, maxHeight);
  const closeThreshold = sheetHeight * 0.3;

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(sheetHeight);
  const isDragging = useSharedValue(false);

  // visible 상태 변경 시 애니메이션
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      sheetTranslateY.value = withSpring(0, SPRING_CONFIG);
    } else {
      overlayOpacity.value = 0;
      sheetTranslateY.value = sheetHeight;
    }
  }, [visible, overlayOpacity, sheetTranslateY, sheetHeight]);

  // 닫기 애니메이션
  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(sheetHeight, ANIMATION_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [onClose, overlayOpacity, sheetTranslateY, sheetHeight]);

  // 드래그 제스처
  const panGesture = Gesture.Pan()
    .enabled(enableDragToClose)
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        sheetTranslateY.value = event.translationY;
        overlayOpacity.value = interpolate(
          event.translationY,
          [0, sheetHeight],
          [1, 0],
          Extrapolation.CLAMP,
        );
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      if (event.translationY > closeThreshold || event.velocityY > 800) {
        runOnJS(handleClose)();
      } else {
        sheetTranslateY.value = withSpring(0, SPRING_CONFIG);
        overlayOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // 애니메이션 스타일
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // iOS blur 효과
  const isIOS = Platform.OS === 'ios';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <ModalContainer>
        {/* 배경 오버레이 */}
        <Overlay style={overlayAnimatedStyle} onTouchEnd={handleClose} />

        {/* 바텀시트 컨테이너 */}
        <SheetContainer style={sheetAnimatedStyle} height={sheetHeight}>
          {isIOS ? (
            <IOSBlurContainer intensity={blurIntensity} borderRadius={BORDER_RADIUS}>
              <SheetContent
                gesture={panGesture}
                title={title}
                onClose={handleClose}
                enableDragToClose={enableDragToClose}
              >
                {children}
              </SheetContent>
            </IOSBlurContainer>
          ) : (
            <AndroidFallbackContainer borderRadius={BORDER_RADIUS}>
              <SheetContent
                gesture={panGesture}
                title={title}
                onClose={handleClose}
                enableDragToClose={enableDragToClose}
              >
                {children}
              </SheetContent>
            </AndroidFallbackContainer>
          )}
        </SheetContainer>
      </ModalContainer>
    </Modal>
  );
}

// 바텀시트 컨텐츠 컴포넌트 (iOS/Android 공통)
interface SheetContentProps {
  gesture: ReturnType<typeof Gesture.Pan>;
  title: string | undefined;
  onClose: () => void;
  enableDragToClose: boolean;
  children: ReactNode;
}

function SheetContent({ gesture, title, onClose, enableDragToClose, children }: SheetContentProps) {
  return (
    <>
      {/* 드래그 핸들 영역 */}
      {enableDragToClose && (
        <GestureDetector gesture={gesture}>
          <DragHandleArea>
            <Handle />
          </DragHandleArea>
        </GestureDetector>
      )}

      {/* 헤더 */}
      {title && (
        <Header>
          <HeaderTitle>{title}</HeaderTitle>
          <CloseButton onPress={onClose} activeOpacity={0.7}>
            <CloseButtonText>✕</CloseButtonText>
          </CloseButton>
        </Header>
      )}

      {/* 컨텐츠 영역 */}
      <ContentContainer>
        <ContentScroll
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: AppSize.responsiveBottomInset + 16 }}
        >
          {children}
        </ContentScroll>
      </ContentContainer>
    </>
  );
}

/* Styled Components */

const ModalContainer = styled.View({
  flex: 1,
});

const Overlay = styled(Animated.View)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

const SheetContainer = styled(Animated.View)<{ height: number }>(({ height }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height,
  overflow: 'hidden',
}));

// iOS: BlurView 컨테이너
// Note: intensity prop은 BlurView에 직접 전달됨 (emotion styled가 unconsumed props를 pass-through)
const IOSBlurContainer = styled(BlurView)<{ intensity: number; borderRadius: number }>(
  ({ borderRadius }) => ({
    flex: 1,
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 30, 0.8)', // iOS 다크모드 반투명 배경
  }),
);

// Android: Fallback 컨테이너
const AndroidFallbackContainer = styled.View<{ borderRadius: number }>(({ borderRadius }) => ({
  flex: 1,
  borderTopLeftRadius: borderRadius,
  borderTopRightRadius: borderRadius,
  backgroundColor: colors.gray06, // Android는 일반 배경색
  overflow: 'hidden',
}));

const DragHandleArea = styled(Animated.View)({
  height: HANDLE_HEIGHT,
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 8,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: Platform.select({
    ios: 'rgba(255, 255, 255, 0.3)',
    android: colors.gray03,
  }),
});

const Header = styled.View({
  height: HEADER_HEIGHT,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: AppSize.ratioWidth(20),
  borderBottomWidth: 1,
  borderBottomColor: Platform.select({
    ios: 'rgba(255, 255, 255, 0.1)',
    android: colors.gray05,
  }),
});

const HeaderTitle = styled.Text({
  ...textStyles.headline2,
  color: colors.white,
});

const CloseButton = styled.TouchableOpacity({
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  backgroundColor: Platform.select({
    ios: 'rgba(255, 255, 255, 0.1)',
    android: colors.gray05,
  }),
});

const CloseButtonText = styled.Text({
  ...textStyles.headline3,
  color: colors.white,
  fontSize: 20,
  lineHeight: 20,
});

const ContentContainer = styled.View({
  flex: 1,
});

const ContentScroll = styled.ScrollView({
  flex: 1,
  paddingHorizontal: AppSize.ratioWidth(20),
  paddingTop: 16,
});

export { GlassBottomSheet };
export type { GlassBottomSheetProps };
