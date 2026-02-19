/**
 * ContentFilterBottomSheet - 콘텐츠 필터 바텀시트
 *
 * 추천, 장르, 국가, 공개연도, 평점 필터가 수직으로 나열된 바텀시트입니다.
 * 상단 탭바는 스크롤 위치에 따라 활성 탭이 자동 변경되며,
 * 탭 클릭 시 해당 섹션으로 스크롤 이동합니다.
 * 빠른탐색 페이지, 검색 페이지 등 다양한 화면에서 재사용 가능합니다.
 *
 * @example
 * <ContentFilterBottomSheet
 *   visible={isFilterVisible}
 *   currentFilter={filter}
 *   onApply={handleFilterApply}
 *   onClose={() => setIsFilterVisible(false)}
 * />
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  InteractionManager,
} from 'react-native';
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
import type { ContentFilter, FilterTabKey } from '@/shared/types/filter/contentFilter';
import { FILTER_TABS, DEFAULT_CONTENT_FILTER } from '@/shared/types/filter/contentFilter';
import { FilterTabBar } from './FilterTabBar';
import { FilterFooter } from './FilterFooter';
import { RecommendFilterTab } from './_tabs/RecommendFilterTab';
import { GenreFilterTab } from './_tabs/GenreFilterTab';
import { CountryFilterTab } from './_tabs/CountryFilterTab';
import { ReleaseYearFilterTab } from './_tabs/ReleaseYearFilterTab';
import { RatingFilterTab } from './_tabs/RatingFilterTab';
import { ChannelFilterTab } from './_tabs/ChannelFilterTab';

interface ContentFilterBottomSheetProps {
  /** 바텀시트 표시 여부 */
  readonly visible: boolean;
  /** 현재 적용된 필터 */
  readonly currentFilter: ContentFilter;
  /** 표시할 탭 목록 (미지정 시 전체 탭) */
  readonly tabs?: readonly FilterTabKey[];
  /** 필터 적용 콜백 */
  readonly onApply: (filter: ContentFilter) => void;
  /** 바텀시트 닫기 콜백 */
  readonly onClose: () => void;
  /** 채널 선택 페이지 이동 요청 콜백 */
  readonly onRequestChannelSelection?: (tempFilter: ContentFilter) => void;
  /** 열릴 때 스크롤 위치를 복원할지 여부 (채널 선택 복귀 시 사용) */
  readonly preserveScrollPosition?: boolean;
}

const SHEET_HEIGHT = AppSize.screenHeight * 0.85;
const CLOSE_THRESHOLD = SHEET_HEIGHT * 0.25;
// 탭 활성화 감지 시 스크롤 상단 여유값
const SCROLL_DETECTION_OFFSET = 50;

function ContentFilterBottomSheet({
  visible,
  currentFilter,
  tabs,
  onApply,
  onClose,
  onRequestChannelSelection,
  preserveScrollPosition = false,
}: ContentFilterBottomSheetProps): React.ReactElement {
  // 임시 필터 상태 (적용 전까지만 유지)
  const [tempFilter, setTempFilter] = useState<ContentFilter>(currentFilter);
  const [activeTab, setActiveTab] = useState<FilterTabKey>('recommend');

  // 스크롤 관련 ref
  const scrollRef = useRef<ScrollView>(null);
  const sectionLayoutsRef = useRef<Record<FilterTabKey, number>>({
    recommend: 0,
    genre: 0,
    country: 0,
    releaseYear: 0,
    rating: 0,
    channel: 0,
  });
  // 탭 클릭으로 스크롤 중인지 여부 (스크롤 이벤트 무시용)
  const isTabScrollingRef = useRef(false);
  // 현재 스크롤 위치 저장 (채널 선택 복귀 시 복원용)
  const scrollYRef = useRef(0);

  // 표시할 탭 필터링 (tabs 변경 시에만 재계산)
  const visibleTabs = useMemo(
    () => (tabs ? FILTER_TABS.filter((tab) => tabs.includes(tab.key)) : FILTER_TABS),
    [tabs],
  );

  // 바텀시트 열릴 때 현재 필터로 초기화
  useEffect(() => {
    if (visible) {
      setTempFilter(currentFilter);

      if (preserveScrollPosition) {
        // 채널 선택 복귀 시: InteractionManager로 안전하게 스크롤 위치 복원
        const savedY = scrollYRef.current;
        const handle = InteractionManager.runAfterInteractions(() => {
          scrollRef.current?.scrollTo({ y: savedY, animated: false });
        });
        return () => handle.cancel();
      }
      // 일반 열기: 스크롤 위치 초기화
      setActiveTab(visibleTabs[0]?.key ?? 'recommend');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    return undefined;
  }, [visible, currentFilter, visibleTabs, preserveScrollPosition]);

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);

  // 닫기 애니메이션
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

  // visible 상태에 따른 애니메이션
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

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

  // 필터 업데이트 핸들러
  const updateFilter = useCallback((partial: Partial<ContentFilter>) => {
    setTempFilter((prev) => ({ ...prev, ...partial }));
  }, []);

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    setTempFilter(DEFAULT_CONTENT_FILTER);
  }, []);

  // 적용 핸들러
  const handleApply = useCallback(() => {
    onApply(tempFilter);
    handleClose();
  }, [tempFilter, onApply, handleClose]);

  // 필터 필드별 업데이트 콜백
  const filterHandlers = useMemo(
    () => ({
      onIncludeEndingChange: (includeEnding: boolean) => updateFilter({ includeEnding }),
      onExcludeWatchedChange: (excludeWatched: boolean) => updateFilter({ excludeWatched }),
      onContentTypeChange: (contentType: ContentFilter['contentType']) =>
        updateFilter({ contentType, genreIds: [] }),
      onGenreIdsChange: (genreIds: number[]) => updateFilter({ genreIds }),
      onCountryCodesChange: (countryCodes: string[]) => updateFilter({ countryCodes }),
      onReleaseYearRangeChange: (releaseYearRange: ContentFilter['releaseYearRange']) =>
        updateFilter({ releaseYearRange }),
      onMinStarRatingChange: (minStarRating: number | null) => updateFilter({ minStarRating }),
      onChannelIdsChange: (channelIds: string[]) => updateFilter({ channelIds }),
    }),
    [updateFilter],
  );

  // 채널 더보기 핸들러
  const handleChannelMorePress = useCallback(() => {
    onRequestChannelSelection?.(tempFilter);
  }, [tempFilter, onRequestChannelSelection]);

  // 섹션 레이아웃 측정
  const handleSectionLayout = useCallback((key: FilterTabKey, event: LayoutChangeEvent) => {
    sectionLayoutsRef.current[key] = event.nativeEvent.layout.y;
  }, []);

  // 탭 클릭 시 해당 섹션으로 스크롤
  const handleTabPress = useCallback((key: FilterTabKey) => {
    setActiveTab(key);
    const y = sectionLayoutsRef.current[key];
    if (y !== undefined) {
      isTabScrollingRef.current = true;
      scrollRef.current?.scrollTo({ y, animated: true });
      // 스크롤 애니메이션 완료 후 플래그 해제
      setTimeout(() => {
        isTabScrollingRef.current = false;
      }, 400);
    }
  }, []);

  // 스크롤 위치에 따른 활성 탭 자동 변경
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // 현재 스크롤 위치 저장 (복원용)
      scrollYRef.current = event.nativeEvent.contentOffset.y;

      if (isTabScrollingRef.current) return;

      const scrollY = event.nativeEvent.contentOffset.y + SCROLL_DETECTION_OFFSET;
      const layouts = sectionLayoutsRef.current;

      // 표시 중인 탭만 역순으로 순회하여 현재 스크롤 위치에 해당하는 섹션 찾기
      const reversedTabs = [...visibleTabs].reverse();
      for (const tab of reversedTabs) {
        const sectionY = layouts[tab.key];
        if (sectionY !== undefined && scrollY >= sectionY) {
          setActiveTab(tab.key);
          return;
        }
      }

      // 최상단이면 첫 번째 탭 활성화
      const firstTab = visibleTabs[0];
      if (firstTab) {
        setActiveTab(firstTab.key);
      }
    },
    [visibleTabs],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
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
              <HeaderTitle>필터</HeaderTitle>
            </DragArea>
          </GestureDetector>

          {/* 탭 바 (스크롤 네비게이터) */}
          <FilterTabBar tabs={visibleTabs} activeTab={activeTab} onTabPress={handleTabPress} />

          {/* 모든 필터 섹션 수직 나열 */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={SCROLL_CONTENT_CONTAINER_STYLE}
          >
            {/* 추천 섹션 */}
            {visibleTabs.some((t) => t.key === 'recommend') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('recommend', e)}>
                <RecommendFilterTab
                  includeEnding={tempFilter.includeEnding}
                  onIncludeEndingChange={filterHandlers.onIncludeEndingChange}
                  excludeWatched={tempFilter.excludeWatched}
                  onExcludeWatchedChange={filterHandlers.onExcludeWatchedChange}
                />
              </SectionWrapper>
            )}

            {/* 장르 섹션 */}
            {visibleTabs.some((t) => t.key === 'genre') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('genre', e)}>
                <GenreFilterTab
                  contentType={tempFilter.contentType}
                  selectedGenreIds={tempFilter.genreIds}
                  onContentTypeChange={filterHandlers.onContentTypeChange}
                  onGenreIdsChange={filterHandlers.onGenreIdsChange}
                />
              </SectionWrapper>
            )}

            {/* 국가 섹션 */}
            {visibleTabs.some((t) => t.key === 'country') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('country', e)}>
                <CountryFilterTab
                  selectedCountryCodes={tempFilter.countryCodes}
                  onCountryCodesChange={filterHandlers.onCountryCodesChange}
                />
              </SectionWrapper>
            )}

            {/* 공개연도 섹션 */}
            {visibleTabs.some((t) => t.key === 'releaseYear') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('releaseYear', e)}>
                <ReleaseYearFilterTab
                  selectedRange={tempFilter.releaseYearRange}
                  onRangeChange={filterHandlers.onReleaseYearRangeChange}
                />
              </SectionWrapper>
            )}

            {/* 평점 섹션 */}
            {visibleTabs.some((t) => t.key === 'rating') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('rating', e)}>
                <RatingFilterTab
                  selectedRating={tempFilter.minStarRating}
                  onRatingChange={filterHandlers.onMinStarRatingChange}
                />
              </SectionWrapper>
            )}

            {/* 채널 섹션 */}
            {visibleTabs.some((t) => t.key === 'channel') && (
              <SectionWrapper onLayout={(e) => handleSectionLayout('channel', e)}>
                <ChannelFilterTab
                  selectedChannelIds={tempFilter.channelIds}
                  onChannelIdsChange={filterHandlers.onChannelIdsChange}
                  onMorePress={handleChannelMorePress}
                />
              </SectionWrapper>
            )}
          </ScrollView>

          {/* 하단 버튼 */}
          <FilterFooter onReset={handleReset} onApply={handleApply} />
        </SheetContainer>
      </ModalContainer>
    </Modal>
  );
}

const SCROLL_CONTENT_CONTAINER_STYLE = { paddingBottom: 20 } as const;

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
  paddingBottom: 4,
});

const Handle = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
});

const HeaderTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: 12,
});

const SectionWrapper = styled.View({
  paddingBottom: 16,
});

export { ContentFilterBottomSheet };
export type { ContentFilterBottomSheetProps };
