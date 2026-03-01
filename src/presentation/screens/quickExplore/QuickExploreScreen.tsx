/**
 * QuickExploreScreen - 빠른탐색 화면
 *
 * 드래그하여 콘텐츠를 탐색할 수 있는 인터랙티브 그리드 화면입니다.
 * 검색 버튼을 누르면 랜덤 콘텐츠로 화려한 애니메이션과 함께 포커스됩니다.
 * 필터 버튼을 누르면 장르/국가/연도/평점 필터 바텀시트가 표시됩니다.
 */

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { ContentFilterBottomSheet } from '@/presentation/components/filter/ContentFilterBottomSheet';
import { GlassIconButton } from '@/presentation/components/button/GlassIconButton';
import colors from '@/shared/styles/colors';
import CloseIcon from '@assets/icons/close.svg';
import { QuickExploreProvider, useQuickExplore } from './_provider/QuickExploreProvider';
import { QuickExploreHeader } from './_components/QuickExploreHeader';
import { ContentGrid } from './_components/ContentGrid';

export default function QuickExploreScreen() {
  return (
    <QuickExploreProvider>
      <QuickExploreContent />
    </QuickExploreProvider>
  );
}

/**
 * QuickExploreContent - 실제 빠른탐색 화면 내용
 *
 * QuickExploreProvider 내부에서 렌더링되어 컨텍스트에 접근 가능
 */
function QuickExploreContent() {
  const insets = useSafeAreaInsets();

  const {
    filter,
    isFilterVisible,
    pendingFilter,
    gridRef,
    handleContentPress,
    handleFilterApply,
    handleFilterClose,
    handleRequestChannelSelection,
    handleClose,
  } = useQuickExplore();

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
        <QuickExploreHeader />

        {/* 필터 바텀시트 */}
        <ContentFilterBottomSheet
          visible={isFilterVisible}
          currentFilter={bottomSheetFilter}
          onApply={handleFilterApply}
          onClose={handleFilterClose}
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
