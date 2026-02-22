/**
 * QuickExplorePage - 빠른탐색 화면
 *
 * 드래그하여 콘텐츠를 탐색할 수 있는 인터랙티브 그리드 화면입니다.
 * 검색 버튼을 누르면 랜덤 콘텐츠로 화려한 애니메이션과 함께 포커스됩니다.
 * 필터 버튼을 누르면 장르/국가/연도/평점 필터 바텀시트가 표시됩니다.
 */

import { useCallback, useRef, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { BasePage } from '@/presentation/components/page/BasePage';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import { ContentFilterBottomSheet } from '@/presentation/components/filter/ContentFilterBottomSheet';
import { channelSelectionBridge } from '@/shared/utils/channelSelectionBridge';
import { useContentFilter } from '@/shared/context/ContentFilterContext';
import { GlassIconButton } from '@/presentation/components/button/GlassIconButton';
import colors from '@/shared/styles/colors';
import CloseIcon from '@assets/icons/close.svg';
import { QuickExploreHeader } from './_components/QuickExploreHeader';
import { ContentGrid, ContentGridRef } from './_components/ContentGrid';

export default function QuickExplorePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const gridRef = useRef<ContentGridRef>(null);

  // 공유 필터 컨텍스트에서 필터 상태 가져오기
  const { filter, setFilter, isFilterApplied } = useContentFilter();
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  // 채널 선택 페이지에서 복귀 시 바텀시트를 복원하기 위한 임시 필터
  const [pendingFilter, setPendingFilter] = useState<ContentFilter | null>(null);

  // pendingFilter의 최신 값을 ref로 유지 (useFocusEffect 의존성 제거)
  const pendingFilterRef = useRef<ContentFilter | null>(null);
  pendingFilterRef.current = pendingFilter;

  // 채널 선택 페이지에서 복귀 시 결과 처리 (화면 포커스당 1회만 실행)
  useFocusEffect(
    useCallback(() => {
      const current = pendingFilterRef.current;
      if (current === null) return;

      const channelResult = channelSelectionBridge.consumeChannelResult();
      if (channelResult !== null) {
        // 채널 선택 결과를 반영한 필터로 바텀시트 재오픈
        setPendingFilter({ ...current, channelIds: channelResult });
      }
      // 결과 유무와 관계없이 pendingFilter가 있으면 바텀시트 복원
      setIsFilterVisible(true);
    }, []),
  );

  // 콘텐츠 클릭 핸들러
  const handleContentPress = useCallback(
    (content: BaseContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
      });
    },
    [navigation],
  );

  // 검색 버튼 클릭 핸들러 - 랜덤 콘텐츠 포커스
  const handleSearchPress = useCallback(() => {
    gridRef.current?.focusOnRandomContent();
  }, []);

  // 필터 버튼 클릭 핸들러
  const handleFilterPress = useCallback(() => {
    setPendingFilter(null);
    setIsFilterVisible(true);
  }, []);

  // 필터 적용 핸들러
  const handleFilterApply = useCallback((newFilter: ContentFilter) => {
    setFilter(newFilter);
    setPendingFilter(null);
    setIsFilterVisible(false);
  }, []);

  // 채널 선택 페이지 이동 요청 핸들러
  const handleRequestChannelSelection = useCallback(
    (tempFilter: ContentFilter) => {
      setPendingFilter(tempFilter);
      setIsFilterVisible(false);
      navigation.navigate(routePages.channelSelection, {
        selectedChannelIds: tempFilter.channelIds,
      });
    },
    [navigation],
  );

  // 닫기 버튼 핸들러
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 바텀시트에 전달할 필터 (pendingFilter가 있으면 해당 값 사용)
  const bottomSheetFilter = pendingFilter ?? filter;

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* 드래그 가능한 콘텐츠 그리드 */}
        <ContentGrid ref={gridRef} filter={filter} onContentPress={handleContentPress} />

        {/* 좌측 상단 닫기 버튼 */}
        <CloseButtonContainer style={{ top: insets.top }}>
          <GlassIconButton size={44} onPress={handleClose}>
            <CloseIcon width={20} height={20} color={colors.white} />
          </GlassIconButton>
        </CloseButtonContainer>

        {/* 하단 헤더 (오버레이) */}
        <QuickExploreHeader
          onFilterPress={handleFilterPress}
          onSearchPress={handleSearchPress}
          isFilterActive={isFilterApplied}
        />

        {/* 필터 바텀시트 */}
        <ContentFilterBottomSheet
          visible={isFilterVisible}
          currentFilter={bottomSheetFilter}
          onApply={handleFilterApply}
          onClose={() => {
            setPendingFilter(null);
            setIsFilterVisible(false);
          }}
          onRequestChannelSelection={handleRequestChannelSelection}
          preserveScrollPosition={pendingFilter !== null}
        />
      </GestureHandlerRootView>
    </BasePage>
  );
}

/* Styled Components */
const CloseButtonContainer = styled.View({
  position: 'absolute',
  left: 16,
  zIndex: 10,
});
