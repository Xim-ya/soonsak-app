/**
 * AdminActionBottomSheet - 어드민 액션 바텀시트
 *
 * 콘텐츠 상세 페이지에서 어드민 전용 액션을 선택하는 바텀시트
 */

import { useCallback, useEffect } from 'react';
import { Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import styled from '@emotion/native';
import { useDialog } from '@/presentation/components/dialog';
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
import { AdminContentAction as AdminContentActionEnum } from '@/features/admin/types';
import { ContentStatusLabel, type ContentStatus } from '@/features/content/types';

// 상태별 칩 색상
const STATUS_CHIP_COLORS: Record<ContentStatus, string> = {
  pending: '#F59E0B', // 노랑
  confirmed: '#10B981', // 초록
  rejected: '#EF4444', // 빨강
  needs_review: '#F97316', // 주황
};

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
  /** 콘텐츠 ID */
  readonly contentId?: number | undefined;
  /** 콘텐츠 타입 */
  readonly contentType?: string | undefined;
  /** 비디오 ID */
  readonly videoId?: string | undefined;
  /** 현재 비디오 상태 (비디오 상태 변경 항목에 칩으로 표시) */
  readonly currentVideoStatus?: ContentStatus | undefined;
}

function AdminActionBottomSheet({
  visible,
  actions,
  onSelectAction,
  onClose,
  contentId,
  contentType,
  videoId,
  currentVideoStatus,
}: AdminActionBottomSheetProps) {
  const { showDialog } = useDialog();

  // ID 칩 영역 높이 (ID가 있을 때만)
  const hasIds = contentId !== undefined || videoId !== undefined;
  const idChipsHeight = hasIds ? 44 : 0;

  // 시트 높이 계산 (옵션 개수에 따라 동적)
  const optionsHeight = actions.length * OPTION_HEIGHT + (actions.length - 1) * OPTION_GAP;
  const sheetHeight =
    optionsHeight +
    SPACING +
    CLOSE_BUTTON_HEIGHT +
    AppSize.responsiveBottomInset +
    24 +
    idChipsHeight;
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

  // ID 복사 핸들러
  const handleCopyId = useCallback(
    async (label: string, value: string) => {
      await Clipboard.setStringAsync(value);
      await showDialog({
        title: '복사됨',
        description: `${label}: ${value}`,
        buttonText: '확인',
      });
    },
    [showDialog],
  );

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
                {/* ID 칩들 */}
                {hasIds && (
                  <IdChipsContainer>
                    {contentId !== undefined && contentType && (
                      <IdChip
                        onPress={() => handleCopyId('Content', `${contentType}/${contentId}`)}
                        activeOpacity={0.7}
                      >
                        <IdChipLabel>Content</IdChipLabel>
                        <IdChipValue>{`${contentType}/${contentId}`}</IdChipValue>
                      </IdChip>
                    )}
                    {videoId && (
                      <IdChip onPress={() => handleCopyId('Video', videoId)} activeOpacity={0.7}>
                        <IdChipLabel>Video</IdChipLabel>
                        <IdChipValue>{videoId}</IdChipValue>
                      </IdChip>
                    )}
                  </IdChipsContainer>
                )}
              </DragArea>
            </GestureDetector>

            {/* 옵션 버튼들 */}
            <OptionsContainer>
              {actions.map((actionConfig, index) => {
                const isVideoStatusAction =
                  actionConfig.action === AdminContentActionEnum.CHANGE_VIDEO_STATUS;
                const showStatusChip = isVideoStatusAction && currentVideoStatus;

                return (
                  <OptionButton
                    key={actionConfig.action}
                    onPress={
                      actionConfig.disabled
                        ? undefined
                        : () => handleSelectAction(actionConfig.action)
                    }
                    activeOpacity={actionConfig.disabled ? 1 : 0.7}
                    isDestructive={actionConfig.isDestructive ?? false}
                    isDisabled={actionConfig.disabled ?? false}
                    isLast={index === actions.length - 1}
                  >
                    <OptionContent>
                      <OptionText
                        isDestructive={actionConfig.isDestructive ?? false}
                        isDisabled={actionConfig.disabled ?? false}
                      >
                        {actionConfig.label}
                      </OptionText>
                      {showStatusChip && (
                        <StatusChip backgroundColor={STATUS_CHIP_COLORS[currentVideoStatus]}>
                          <StatusChipText>{ContentStatusLabel[currentVideoStatus]}</StatusChipText>
                        </StatusChip>
                      )}
                    </OptionContent>
                    {actionConfig.disabled && actionConfig.disabledReason && (
                      <DisabledReasonText>{actionConfig.disabledReason}</DisabledReasonText>
                    )}
                  </OptionButton>
                );
              })}
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

const IdChipsContainer = styled.View({
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
  paddingBottom: 12,
});

const IdChip = styled.TouchableOpacity({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 16,
  gap: 6,
});

const IdChipLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const IdChipValue = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontWeight: '500',
});

const OptionsContainer = styled.View({
  backgroundColor: colors.gray06,
  borderRadius: BORDER_RADIUS,
  overflow: 'hidden',
});

interface OptionButtonProps {
  isDestructive: boolean;
  isDisabled: boolean;
  isLast: boolean;
}

const OptionButton = styled.TouchableOpacity<OptionButtonProps>(
  ({ isDestructive, isDisabled, isLast }) => ({
    height: OPTION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDestructive ? 'rgba(255, 72, 78, 0.1)' : 'transparent',
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.gray05,
    opacity: isDisabled ? 0.4 : 1,
  }),
);

interface OptionTextProps {
  isDestructive: boolean;
  isDisabled: boolean;
}

const OptionContent = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
});

const OptionText = styled.Text<OptionTextProps>(({ isDestructive, isDisabled }) => ({
  ...textStyles.title2,
  color: isDisabled ? colors.gray03 : isDestructive ? colors.red : colors.white,
}));

const StatusChip = styled.View<{ backgroundColor: string }>(({ backgroundColor }) => ({
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 10,
  backgroundColor,
}));

const StatusChipText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontWeight: '600',
});

const DisabledReasonText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 2,
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

export { AdminActionBottomSheet };
