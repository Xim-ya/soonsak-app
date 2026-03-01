/**
 * MyScreen - MY 탭 화면
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
  useFullyWatchedCount,
  WatchHistorySectionView,
  type WatchHistoryModelType,
} from '@/features/watch-history';
import { useFavoritesCount } from '@/features/favorites';
import { useCalendarNavigation, useRatingsCount } from './_hooks';
import {
  MyScreenHeader,
  UserProfileSection,
  UserStatsSection,
  WatchCalendar,
  MonthYearPickerBottomSheet,
} from './_components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCROLL_BOTTOM_PADDING = AppSize.ratioHeight(40);

export default function MyScreen() {
  const navigation = useNavigation<NavigationProp>();

  // 유저 프로필 및 인증 상태
  const { status, displayName, avatarUrl } = useAuth();
  const isGuest = status === 'unauthenticated';

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

  // 시청 기록 아이템 클릭 핸들러 (콘텐츠 상세 페이지로 이동)
  // initialData로 이미지 경로와 진행률을 전달하여 API 응답 전에 즉시 표시
  const handleWatchHistoryItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        type: item.contentType,
        title: item.contentTitle,
        initialData: {
          backdropPath: item.contentBackdropPath,
          posterPath: item.contentPosterPath,
          progressSeconds: item.progressSeconds,
          durationSeconds: item.durationSeconds,
        },
      });
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

  // 시청기록 전체 보기 핸들러
  const handleViewAllWatchHistory = useCallback(() => {
    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.watchHistory, {});
  }, [isGuest, navigation]);

  // 캘린더 날짜 클릭 핸들러 (해당 날짜의 시청기록 페이지로 이동)
  const handleCalendarDatePress = useCallback(
    (date: string) => {
      if (isGuest) {
        setLoginDialogVisible(true);
        return;
      }
      navigation.navigate(routePages.watchHistory, { date });
    },
    [isGuest, navigation],
  );

  return (
    <BasePage touchableWithoutFeedback={false}>
      <Container>
        <MyScreenHeader onSettingsPress={handleSettingsPress} />
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

          <WatchHistorySectionView
            onItemPress={handleWatchHistoryItemPress}
            onViewAllPress={handleViewAllWatchHistory}
          />

          <WatchCalendar
            year={selectedYear}
            month={selectedMonth}
            calendarData={calendarData}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onOpenMonthPicker={handleOpenMonthPicker}
            onDatePress={handleCalendarDatePress}
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

      <LoginPromptDialog visible={isLoginDialogVisible} onClose={handleCloseLoginDialog} />
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
