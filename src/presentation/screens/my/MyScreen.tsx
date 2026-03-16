/**
 * MyScreen - MY 탭 화면
 *
 * 사용자 프로필 및 시청 기록을 관리하는 화면입니다.
 * - 프로필 정보 표시
 * - 시청 작품 캘린더
 * - 시청 기록 목록
 */

import { ScrollView } from 'react-native';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/presentation/styles/colors';
import { AppSize } from '@/presentation/utils/appSize';
import { WatchHistorySectionView } from '@/presentation/components/watch-history';
import { MyScreenProvider, useMyScreen } from './_provider';
import {
  MyScreenHeader,
  UserProfileSection,
  UserStatsSection,
  WatchCalendar,
  MonthYearPickerBottomSheet,
} from './_components';

const SCROLL_BOTTOM_PADDING = AppSize.ratioHeight(120);

export default function MyScreen() {
  return (
    <MyScreenProvider>
      <MyScreenContent />
    </MyScreenProvider>
  );
}

/**
 * MyScreenContent - MY 탭 화면 내용
 *
 * MyScreenProvider 내부에서 렌더링되어 Context에 접근 가능합니다.
 */
function MyScreenContent() {
  const {
    // 로그인 다이얼로그 상태
    isLoginDialogVisible,
    hideLoginDialog,
    // 네비게이션 핸들러
    handleViewAllWatchHistory,
    handleWatchHistoryItemPress,
  } = useMyScreen();

  return (
    <BasePage touchableWithoutFeedback={false} safeAreaBottom={false}>
      <Container>
        <MyScreenHeader />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={SCROLL_CONTENT_STYLE}
          nestedScrollEnabled
        >
          <UserProfileSection />
          <UserStatsSection />
          <Gap size={20} />
          <WatchHistorySectionView
            onItemPress={handleWatchHistoryItemPress}
            onViewAllPress={handleViewAllWatchHistory}
          />
          <WatchCalendar />
        </ScrollView>
      </Container>

      <MonthYearPickerBottomSheet />
      <LoginPromptDialog visible={isLoginDialogVisible} onClose={hideLoginDialog} />
    </BasePage>
  );
}

/* Styled Components */

const SCROLL_CONTENT_STYLE = {
  paddingBottom: SCROLL_BOTTOM_PADDING,
};

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});
