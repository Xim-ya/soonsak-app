import React, { useEffect, useCallback } from 'react';
import { Modal, Image, ScrollView } from 'react-native';
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
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { WatchProviderModel } from '@/features/tmdb/types/watchProviderModel';
import { openOttApp } from '@/features/tmdb/config/ottDeepLinks';
import CloseIcon from '@assets/icons/back_arrow.svg';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface PlayerWatchProviderBottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly providers: WatchProviderModel[];
}

const SHEET_HEIGHT = AppSize.screenHeight * 0.5;
const CLOSE_THRESHOLD = SHEET_HEIGHT * 0.25;

function PlayerWatchProviderBottomSheet({
  visible,
  onClose,
  providers,
}: PlayerWatchProviderBottomSheetProps): React.ReactElement {
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);

  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 250, easing: Easing.inOut(Easing.ease) },
      () => {
        runOnJS(onClose)();
      },
    );
  }, [onClose, overlayOpacity, sheetTranslateY]);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        sheetTranslateY.value = event.translationY;
        overlayOpacity.value = interpolate(
          event.translationY,
          [0, SHEET_HEIGHT],
          [1, 0],
          Extrapolation.CLAMP,
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_THRESHOLD || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        sheetTranslateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        });
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const handleProviderPress = useCallback((providerId: number) => {
    openOttApp(providerId);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <ModalContainer>
        <Overlay style={overlayAnimatedStyle} onTouchEnd={handleClose} />

        <SheetContainer style={sheetAnimatedStyle}>
          <GestureDetector gesture={panGesture}>
            <DragArea>
              <HandleContainer>
                <Handle />
              </HandleContainer>

              <HeaderContainer>
                <HeaderTitle>보는 곳</HeaderTitle>
                <CloseButton onPress={handleClose}>
                  <CloseIcon width={24} height={24} style={{ transform: [{ rotate: '90deg' }] }} />
                </CloseButton>
              </HeaderContainer>

              <Divider />
            </DragArea>
          </GestureDetector>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: AppSize.bottomInset + 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            {providers.map((provider) => (
              <ProviderRow
                key={provider.providerId}
                onPress={() => handleProviderPress(provider.providerId)}
                activeOpacity={0.7}
              >
                <ProviderLogo
                  source={{
                    uri: formatter.prefixTmdbImgUrl(provider.logoPath, {
                      size: TmdbImageSize.w92,
                    }),
                  }}
                />
                <ProviderName>{provider.providerName}</ProviderName>
                <RightArrowIcon width={16} height={16} />
              </ProviderRow>
            ))}
          </ScrollView>
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
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
});

const SheetContainer = styled(Animated.View)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: SHEET_HEIGHT,
  backgroundColor: colors.gray05,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
});

const DragArea = styled(Animated.View)({});

const HandleContainer = styled.View({
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 4,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
});

const HeaderContainer = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 12,
});

const HeaderTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const CloseButton = styled.TouchableOpacity({
  padding: 4,
});

const Divider = styled.View({
  height: 1,
  backgroundColor: colors.gray04,
});

const ProviderRow = styled.TouchableOpacity({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
});

const ProviderLogo = styled(Image)({
  width: 48,
  height: 48,
  borderRadius: 10,
});

const ProviderName = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  flex: 1,
  marginLeft: 12,
});

export { PlayerWatchProviderBottomSheet };
