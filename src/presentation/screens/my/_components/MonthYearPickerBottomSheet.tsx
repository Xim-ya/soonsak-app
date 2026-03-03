/**
 * MonthYearPickerBottomSheet - 년/월 선택 바텀시트
 *
 * 캘린더의 년/월을 선택하는 스크롤 피커 스타일 바텀시트입니다.
 * - 년도와 월을 각각 스크롤로 선택
 * - 적용하기 버튼으로 선택 완료
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Modal, FlatList, ListRenderItem } from 'react-native';
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
import { analyticsService } from '@/shared/analytics';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { useMyScreen } from '../_provider';

const SHEET_HEIGHT = AppSize.screenHeight * 0.45;
const CLOSE_THRESHOLD = SHEET_HEIGHT * 0.25;
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// 년도 범위 (현재 년도 기준 +-10년)
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function MonthYearPickerBottomSheet() {
  const {
    isMonthPickerVisible,
    selectedYear,
    selectedMonth,
    handleApplyMonthYear,
    handleCloseMonthPicker,
  } = useMyScreen();

  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  const yearListRef = useRef<FlatList>(null);
  const monthListRef = useRef<FlatList>(null);

  // 액션 수행 여부 추적 (닫기 시 actionTaken 판단용)
  const actionTakenRef = useRef(false);

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);

  // visible 상태에 따른 초기화
  useEffect(() => {
    if (isMonthPickerVisible) {
      actionTakenRef.current = false;
      analyticsService.bottomSheetOpen({
        sheet_type: 'month_year_picker',
        screen_name: 'my',
      });
      setTempYear(selectedYear);
      setTempMonth(selectedMonth);

      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });

      // 초기 스크롤 위치 설정
      setTimeout(() => {
        const yearIndex = YEARS.indexOf(selectedYear);
        const monthIndex = selectedMonth - 1;

        yearListRef.current?.scrollToIndex({
          index: Math.max(0, yearIndex),
          animated: false,
          viewPosition: 0.5,
        });
        monthListRef.current?.scrollToIndex({
          index: monthIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [isMonthPickerVisible, selectedYear, selectedMonth, overlayOpacity, sheetTranslateY]);

  // 닫기 애니메이션
  const handleClose = useCallback(() => {
    analyticsService.bottomSheetClose({
      sheet_type: 'month_year_picker',
      screen_name: 'my',
      action_taken: actionTakenRef.current,
    });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 250, easing: Easing.inOut(Easing.ease) },
      () => {
        runOnJS(handleCloseMonthPicker)();
      },
    );
  }, [handleCloseMonthPicker, overlayOpacity, sheetTranslateY]);

  // 적용 핸들러
  const handleApply = useCallback(() => {
    actionTakenRef.current = true;
    handleApplyMonthYear(tempYear, tempMonth);
    handleClose();
  }, [tempYear, tempMonth, handleApplyMonthYear, handleClose]);

  // 드래그 제스처
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

  // 애니메이션 스타일
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // 스크롤 종료 시 선택된 값 업데이트
  const handleYearScroll = useCallback((index: number) => {
    const year = YEARS[index];
    if (year !== undefined) {
      setTempYear(year);
    }
  }, []);

  const handleMonthScroll = useCallback((index: number) => {
    const month = MONTHS[index];
    if (month !== undefined) {
      setTempMonth(month);
    }
  }, []);

  // 렌더 아이템
  const renderYearItem: ListRenderItem<number> = useCallback(
    ({ item }) => {
      const isSelected = item === tempYear;
      return (
        <PickerItem isSelected={isSelected}>
          <PickerItemText isSelected={isSelected}>{item}년</PickerItemText>
        </PickerItem>
      );
    },
    [tempYear],
  );

  const renderMonthItem: ListRenderItem<number> = useCallback(
    ({ item }) => {
      const isSelected = item === tempMonth;
      return (
        <PickerItem isSelected={isSelected}>
          <PickerItemText isSelected={isSelected}>{item}월</PickerItemText>
        </PickerItem>
      );
    },
    [tempMonth],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const handleYearMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      handleYearScroll(index);
    },
    [handleYearScroll],
  );

  const handleMonthMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      handleMonthScroll(index);
    },
    [handleMonthScroll],
  );

  // 패딩 아이템 계산
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <Modal
      visible={isMonthPickerVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <ModalContainer>
        {/* 배경 오버레이 */}
        <Overlay style={overlayAnimatedStyle} onTouchEnd={handleClose} />

        {/* 바텀시트 컨테이너 */}
        <SheetContainer style={sheetAnimatedStyle}>
          {/* 드래그 핸들 영역 */}
          <GestureDetector gesture={panGesture}>
            <DragArea>
              <HandleContainer>
                <Handle />
              </HandleContainer>
            </DragArea>
          </GestureDetector>

          {/* 피커 컨테이너 */}
          <PickerContainer>
            {/* 선택 표시 영역 */}
            <SelectionIndicator />

            {/* 년도 피커 */}
            <PickerColumn>
              <FlatList
                ref={yearListRef}
                data={YEARS}
                renderItem={renderYearItem}
                keyExtractor={(item) => `year-${item}`}
                getItemLayout={getItemLayout}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleYearMomentumScrollEnd}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT * paddingItems,
                }}
              />
            </PickerColumn>

            {/* 월 피커 */}
            <PickerColumn>
              <FlatList
                ref={monthListRef}
                data={MONTHS}
                renderItem={renderMonthItem}
                keyExtractor={(item) => `month-${item}`}
                getItemLayout={getItemLayout}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMonthMomentumScrollEnd}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT * paddingItems,
                }}
              />
            </PickerColumn>
          </PickerContainer>

          {/* 적용 버튼 */}
          <ApplyButtonContainer>
            <ApplyButton onPress={handleApply} activeOpacity={0.8}>
              <ApplyButtonText>적용하기</ApplyButtonText>
            </ApplyButton>
          </ApplyButtonContainer>
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

const SheetContainer = styled(Animated.View)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: SHEET_HEIGHT,
  backgroundColor: colors.gray06,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
});

const DragArea = styled(Animated.View)({});

const HandleContainer = styled.View({
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 16,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
});

const PickerContainer = styled.View({
  flexDirection: 'row',
  height: PICKER_HEIGHT,
  position: 'relative',
});

const SelectionIndicator = styled.View({
  position: 'absolute',
  left: AppSize.ratioWidth(24),
  right: AppSize.ratioWidth(24),
  top: ITEM_HEIGHT * 2,
  height: ITEM_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 8,
});

const PickerColumn = styled.View({
  flex: 1,
  height: PICKER_HEIGHT,
  overflow: 'hidden',
});

const PickerItem = styled.View<{ isSelected: boolean }>({
  height: ITEM_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
});

const PickerItemText = styled.Text<{ isSelected: boolean }>(({ isSelected }) => ({
  ...textStyles.headline2,
  color: isSelected ? colors.white : colors.gray03,
}));

const ApplyButtonContainer = styled.View({
  paddingHorizontal: AppSize.ratioWidth(16),
  paddingVertical: AppSize.ratioHeight(16),
  paddingBottom: AppSize.responsiveBottomInset + AppSize.ratioHeight(16),
});

const ApplyButton = styled.TouchableOpacity({
  backgroundColor: colors.main,
  paddingVertical: AppSize.ratioHeight(16),
  borderRadius: 8,
  alignItems: 'center',
});

const ApplyButtonText = styled.Text({
  ...textStyles.title1,
  color: colors.black,
});

export { MonthYearPickerBottomSheet };
