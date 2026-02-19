/**
 * MyPage - MY 탭 화면
 *
 * 사용자 프로필 및 시청 기록을 관리하는 화면입니다.
 * - 프로필 정보 표시
 * - 시청 작품 캘린더
 * - 시청 기록 목록
 */

import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BasePage } from '@/presentation/components/page/BasePage';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useAuth } from '@/shared/providers/AuthProvider';
import {
  useWatchHistoryCalendar,
  useUniqueWatchHistory,
  useFullyWatchedCount,
  type WatchHistoryModelType,
} from '@/features/watch-history';
import { useFavoritesCount } from '@/features/favorites';
import { useSocialLogin } from '@/presentation/pages/login/_hooks/useSocialLogin';
import { useCalendarNavigation, useRatingsCount } from './_hooks';
import {
  MyPageHeader,
  UserProfileSection,
  UserStatsSection,
  WatchCalendar,
  WatchHistoryList,
  MonthYearPickerBottomSheet,
} from './_components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCROLL_BOTTOM_PADDING = AppSize.ratioHeight(40);

export default function MyPage() {
  const navigation = useNavigation<NavigationProp>();

  // 유저 프로필 및 인증 상태
  const { status, displayName, avatarUrl } = useAuth();
  const isGuest = status === 'unauthenticated';

  // 소셜 로그인
  const { handleLogin, loadingProvider } = useSocialLogin();

  // 프로필 클릭 시 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  // 캘린더 네비게이션
  const {
    selectedYear,
    selectedMonth,
    isMonthPickerVisible,
    handlePrevMonth,
    handleNextMonth,
    handleOpenMonthPicker,
    handleCloseMonthPicker,
    handleApplyMonthYear,
  } = useCalendarNavigation();

  // 캘린더 시청 기록 조회
  const { data: calendarData } = useWatchHistoryCalendar(selectedYear, selectedMonth);

  // 고유 콘텐츠 시청 기록 조회 (하단 목록용)
  const { data: watchHistoryData, isLoading: isHistoryLoading } = useUniqueWatchHistory(10, 0);

  // 통계 데이터 조회
  const { data: favoritesCount = 0 } = useFavoritesCount();
  const { data: ratingsCount = 0 } = useRatingsCount();
  const { data: watchedCount = 0 } = useFullyWatchedCount();

  // 설정 페이지 이동 핸들러
  const handleSettingsPress = useCallback(() => {
    navigation.navigate(routePages.settings);
  }, [navigation]);

  // 프로필 클릭 핸들러
  const handleProfilePress = useCallback(() => {
    if (isGuest) {
      setLoginDialogVisible(true);
    } else {
      navigation.navigate(routePages.profileSetup, { mode: 'edit' });
    }
  }, [isGuest, navigation]);

  // 로그인 다이얼로그 핸들러
  const handleCloseLoginDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

  const handleKakaoLogin = useCallback(() => {
    handleLogin('kakao');
    setLoginDialogVisible(false);
  }, [handleLogin]);

  const handleOtherLogin = useCallback(() => {
    navigation.navigate(routePages.login, { canGoBack: true });
    setLoginDialogVisible(false);
  }, [navigation]);

  // 시청 기록 아이템 클릭 핸들러 (이어보기: 플레이어로 직접 이동)
  const handleWatchHistoryItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      const playerParams = {
        videoId: item.videoId,
        title: item.contentTitle,
        contentId: item.contentId,
        contentType: item.contentType,
        ...(item.progressSeconds > 0 && { startSeconds: item.progressSeconds }),
      };
      navigation.navigate(routePages.player, playerParams);
    },
    [navigation],
  );

  // 통계 섹션 클릭 핸들러 (initialTab: 0=찜했어요, 1=평가했어요, 2=봤어요)
  const handleFavoritesPress = useCallback(() => {
    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 0 });
  }, [isGuest, navigation]);

  const handleRatingsPress = useCallback(() => {
    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 1 });
  }, [isGuest, navigation]);

  const handleWatchedPress = useCallback(() => {
    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 2 });
  }, [isGuest, navigation]);

  return (
    <BasePage touchableWithoutFeedback={false}>
      <Container>
        <MyPageHeader onSettingsPress={handleSettingsPress} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={SCROLL_CONTENT_STYLE}
          nestedScrollEnabled
        >
          <UserProfileSection
            displayName={displayName}
            avatarUrl={avatarUrl}
            onPress={handleProfilePress}
          />

          <UserStatsSection
            favoritesCount={favoritesCount}
            ratingsCount={ratingsCount}
            watchedCount={watchedCount}
            onFavoritesPress={handleFavoritesPress}
            onRatingsPress={handleRatingsPress}
            onWatchedPress={handleWatchedPress}
          />

          <Gap size={20} />

          {watchHistoryData && (
            <WatchHistoryList
              items={watchHistoryData.items}
              isLoading={isHistoryLoading}
              onItemPress={handleWatchHistoryItemPress}
            />
          )}

          <WatchCalendar
            year={selectedYear}
            month={selectedMonth}
            calendarData={calendarData}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onOpenMonthPicker={handleOpenMonthPicker}
          />
        </ScrollView>
      </Container>

      <MonthYearPickerBottomSheet
        visible={isMonthPickerVisible}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onApply={handleApplyMonthYear}
        onClose={handleCloseMonthPicker}
      />

      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={handleCloseLoginDialog}
        onKakaoLogin={handleKakaoLogin}
        onOtherLogin={handleOtherLogin}
        isKakaoLoading={loadingProvider === 'kakao'}
      />
    </BasePage>
  );
}

/* Styles */

const SCROLL_CONTENT_STYLE = {
  paddingBottom: SCROLL_BOTTOM_PADDING,
};

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});
