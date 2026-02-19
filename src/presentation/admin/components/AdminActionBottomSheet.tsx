/**
 * AdminActionBottomSheet - 어드민 액션 바텀시트
 *
 * 콘텐츠 상세 페이지에서 어드민 전용 액션을 선택하는 바텀시트
 */

import { useCallback, useEffect } from 'react';
import { Modal } from 'react-native';
import styled from '@emotion/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { AdminActionConfig, AdminContentAction } from '@/features/admin/types';

// 상수 정의
const OPTION_HEIGHT = 56;
const CLOSE_BUTTON_HEIGHT = 56;
const SPACING = 8;
const OPTION_GAP = 8;
const BORDER_RADIUS = 12;

interface AdminActionBottomSheetProps {
  /** 바텀시트 표시 여부 */
  readonly visible: boolean;
  /** 액션 목록 */
  readonly actions: AdminActionConfig[];
  /** 액션 선택 시 호출 */
  readonly onSelectAction: (action: AdminContentAction) => void;
  /** 닫기 콜백 */
  readonly onClose: () => void;
}

function AdminActionBottomSheet({
  visible,
  actions,
  onSelectAction,
  onClose,
}: AdminActionBottomSheetProps) {
  // 시트 높이 계산 (옵션 개수에 따라 동적)
  const optionsHeight = actions.length * OPTION_HEIGHT + (actions.length - 1) * OPTION_GAP;
  const sheetHeight =
    optionsHeight + SPACING + CLOSE_BUTTON_HEIGHT + AppSize.responsiveBottomInset + 24;
  const closeThreshold = sheetHeight * 0.25;

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(sheetHeight);

  // visible 상태에 따른 애니메이션
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      overlayOpacity.value = 0;
      sheetTranslateY.value = sheetHeight;
    }
  }, [visible, overlayOpacity, sheetTranslateY, sheetHeight]);

  // 닫기 애니메이션
  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(
      sheetHeight,
      { duration: 250, easing: Easing.inOut(Easing.ease) },
      () => {
        runOnJS(onClose)();
      },
    );
  }, [onClose, overlayOpacity, sheetTranslateY, sheetHeight]);

  // 액션 선택 핸들러
  const handleSelectAction = useCallback(
    (action: AdminContentAction) => {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(
        sheetHeight,
        { duration: 250, easing: Easing.inOut(Easing.ease) },
        () => {
          runOnJS(onSelectAction)(action);
        },
      );
    },
    [onSelectAction, overlayOpacity, sheetTranslateY, sheetHeight],
  );

  // 드래그 제스처
  const panGesture = Gesture.Pan()
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
      if (event.translationY > closeThreshold || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        sheetTranslateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        });
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  // 애니메이션 스타일
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <ModalContainer>
        {/* 배경 오버레이 */}
        <Overlay style={overlayAnimatedStyle} onTouchEnd={handleClose} />

        {/* 바텀시트 컨테이너 */}
        <SheetContainer style={sheetAnimatedStyle} height={sheetHeight}>
          <ContentWrapper>
            {/* 드래그 핸들 */}
            <GestureDetector gesture={panGesture}>
              <DragArea>
                <HandleContainer>
                  <Handle />
                </HandleContainer>
                {/* 어드민 배지 */}
                <AdminBadgeContainer>
                  <AdminBadge>
                    <AdminBadgeText>관리자</AdminBadgeText>
                  </AdminBadge>
                </AdminBadgeContainer>
              </DragArea>
            </GestureDetector>

            {/* 옵션 버튼들 */}
            <OptionsContainer>
              {actions.map((actionConfig, index) => (
                <OptionButton
                  key={actionConfig.action}
                  onPress={() => handleSelectAction(actionConfig.action)}
                  activeOpacity={0.7}
                  isDestructive={actionConfig.isDestructive ?? false}
                  isLast={index === actions.length - 1}
                >
                  <OptionText isDestructive={actionConfig.isDestructive ?? false}>
                    {actionConfig.label}
                  </OptionText>
                </OptionButton>
              ))}
            </OptionsContainer>

            {/* 스페이서 */}
            <Spacer />

            {/* 닫기 버튼 */}
            <CloseButton onPress={handleClose} activeOpacity={0.7}>
              <CloseButtonText>닫기</CloseButtonText>
            </CloseButton>
          </ContentWrapper>
        </SheetContainer>
      </ModalContainer>
    </Modal>
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
  backgroundColor: colors.overlay,
});

const SheetContainer = styled(Animated.View)<{ height: number }>(({ height }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height,
  paddingHorizontal: 16,
}));

const ContentWrapper = styled.View({
  flex: 1,
});

const DragArea = styled(Animated.View)({});

const HandleContainer = styled.View({
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 8,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
});

const AdminBadgeContainer = styled.View({
  alignItems: 'center',
  paddingBottom: 12,
});

const AdminBadge = styled.View({
  backgroundColor: colors.primary,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
});

const AdminBadgeText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  fontWeight: '600',
});

const OptionsContainer = styled.View({
  backgroundColor: colors.gray06,
  borderRadius: BORDER_RADIUS,
  overflow: 'hidden',
});

interface OptionButtonProps {
  isDestructive: boolean;
  isLast: boolean;
}

const OptionButton = styled.TouchableOpacity<OptionButtonProps>(
  ({ isDestructive, isLast }) => ({
    height: OPTION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDestructive ? 'rgba(255, 72, 78, 0.1)' : 'transparent',
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.gray05,
  }),
);

const OptionText = styled.Text<{ isDestructive: boolean }>(({ isDestructive }) => ({
  ...textStyles.title2,
  color: isDestructive ? colors.red : colors.white,
}));

const Spacer = styled.View({
  height: SPACING,
});

const CloseButton = styled.TouchableOpacity({
  height: CLOSE_BUTTON_HEIGHT,
  backgroundColor: colors.gray06,
  borderRadius: BORDER_RADIUS,
  alignItems: 'center',
  justifyContent: 'center',
});

const CloseButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

export { AdminActionBottomSheet };
