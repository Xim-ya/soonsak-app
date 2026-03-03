/**
 * FavoriteActionBottomSheet - 찜하기 액션 바텀시트
 *
 * 콘텐츠 상세 페이지에서 찜하기/찜해제 액션을 선택하는 바텀시트입니다.
 * Flutter Plotz 프로젝트의 EpisodeBottomSheet 디자인 참고
 */

import React, { useCallback, useEffect, useRef } from 'react';
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
import { SvgXml } from 'react-native-svg';
import { analyticsService } from '@/shared/analytics';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

// 상수 정의
const OPTION_HEIGHT = 56;
const CLOSE_BUTTON_HEIGHT = 56;
const SPACING = 8;
const BORDER_RADIUS = 12;

// 북마크 아이콘 (outline)
const bookmarkOutlineSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" stroke="${colors.white}" stroke-width="1.5" fill="none"/>
</svg>
`;

// 북마크 아이콘 (filled with x)
const bookmarkRemoveSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" stroke="${colors.white}" stroke-width="1.5" fill="none"/>
<path d="M9 8L15 14M15 8L9 14" stroke="${colors.white}" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`;

interface FavoriteActionBottomSheetProps {
  /** 바텀시트 표시 여부 */
  readonly visible: boolean;
  /** 현재 찜 상태 */
  readonly isFavorited: boolean;
  /** 버튼 비활성화 여부 (중복 클릭 방지) */
  readonly disabled?: boolean;
  /** 찜 토글 시 호출 */
  readonly onToggleFavorite: () => void;
  /** 닫기 콜백 */
  readonly onClose: () => void;
  /** 화면 이름 (GA 로깅용) */
  readonly screenName?: string | undefined;
}

function FavoriteActionBottomSheet({
  visible,
  isFavorited,
  disabled = false,
  onToggleFavorite,
  onClose,
  screenName,
}: FavoriteActionBottomSheetProps) {
  // 시트 높이 계산
  const sheetHeight =
    OPTION_HEIGHT + SPACING + CLOSE_BUTTON_HEIGHT + AppSize.responsiveBottomInset + 12;
  const closeThreshold = sheetHeight * 0.25;

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(sheetHeight);

  // 액션 수행 여부 추적 (닫기 시 actionTaken 판단용)
  const actionTakenRef = useRef(false);

  // visible 상태에 따른 애니메이션
  useEffect(() => {
    if (visible) {
      actionTakenRef.current = false;
      analyticsService.bottomSheetOpen({
        sheet_type: 'favorite_action',
        screen_name: screenName ?? 'unknown',
      });
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      // visible이 외부에서 false로 변경될 때 애니메이션 값 초기화
      overlayOpacity.value = 0;
      sheetTranslateY.value = sheetHeight;
    }
  }, [visible, overlayOpacity, sheetTranslateY, sheetHeight, screenName]);

  // 닫기 애니메이션
  const handleClose = useCallback(() => {
    analyticsService.bottomSheetClose({
      sheet_type: 'favorite_action',
      screen_name: screenName ?? 'unknown',
      action_taken: actionTakenRef.current,
    });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(
      sheetHeight,
      { duration: 250, easing: Easing.inOut(Easing.ease) },
      () => {
        runOnJS(onClose)();
      },
    );
  }, [onClose, overlayOpacity, sheetTranslateY, sheetHeight, screenName]);

  // 찜 토글 핸들러
  const handleToggleFavorite = useCallback(() => {
    if (disabled) return;
    actionTakenRef.current = true;
    onToggleFavorite();
    handleClose();
  }, [onToggleFavorite, handleClose, disabled]);

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

  const actionText = isFavorited ? '찜 해제하기' : '찜하기';
  const actionIcon = isFavorited ? bookmarkRemoveSvg : bookmarkOutlineSvg;

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
              </DragArea>
            </GestureDetector>

            {/* 옵션 버튼 */}
            <OptionButton
              onPress={handleToggleFavorite}
              activeOpacity={0.7}
              disabled={disabled}
              style={{ opacity: disabled ? 0.5 : 1 }}
            >
              <SvgXml xml={actionIcon} width={20} height={20} />
              <OptionText>{actionText}</OptionText>
            </OptionButton>

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
  paddingBottom: 12,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
});

const OptionButton = styled.TouchableOpacity({
  height: OPTION_HEIGHT,
  backgroundColor: colors.gray06,
  borderRadius: BORDER_RADIUS,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
});

const OptionText = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

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

export { FavoriteActionBottomSheet };
