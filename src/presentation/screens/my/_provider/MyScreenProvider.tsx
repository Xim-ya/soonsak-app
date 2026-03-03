/**
 * MyScreenProvider - MY 탭 화면 상태 관리 Provider
 *
 * MY 탭 화면에서 공유되는 상태들을 Context로 통합 관리합니다.
 * - 로그인 다이얼로그 상태
 * - 캘린더 네비게이션 상태
 * - 통계 데이터
 * - 네비게이션 핸들러
 *
 * @example
 * <MyScreenProvider>
 *   <MyScreenContent />
 * </MyScreenProvider>
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useAuth } from '@/shared/providers/AuthProvider';
import { ContentSource, analyticsService } from '@/shared/analytics';
import {
  useWatchHistoryCalendar,
  useFullyWatchedCount,
  type WatchHistoryModelType,
  type WatchHistoryCalendarItemDto,
} from '@/features/watch-history';
import { useFavoritesCount } from '@/features/favorites';
import { useCalendarNavigation, useRatingsCount } from '../_hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 로그인 다이얼로그 관련 상태 */
interface LoginDialogState {
  readonly isLoginDialogVisible: boolean;
  readonly showLoginDialog: () => void;
  readonly hideLoginDialog: () => void;
}

/** 캘린더 관련 상태 */
interface CalendarState {
  readonly selectedYear: number;
  readonly selectedMonth: number;
  readonly isMonthPickerVisible: boolean;
  readonly calendarData: WatchHistoryCalendarItemDto[] | undefined;
  readonly handlePrevMonth: () => void;
  readonly handleNextMonth: () => void;
  readonly handleOpenMonthPicker: () => void;
  readonly handleCloseMonthPicker: () => void;
  readonly handleApplyMonthYear: (year: number, month: number) => void;
  readonly handleCalendarDatePress: (date: string) => void;
}

/** 사용자 프로필 관련 상태 */
interface UserProfileState {
  readonly isGuest: boolean;
  readonly displayName: string;
  readonly avatarUrl: string | undefined;
  readonly handleProfilePress: () => void;
}

/** 통계 관련 상태 */
interface StatsState {
  readonly favoritesCount: number;
  readonly ratingsCount: number;
  readonly watchedCount: number;
  readonly handleFavoritesPress: () => void;
  readonly handleRatingsPress: () => void;
  readonly handleWatchedPress: () => void;
}

/** 네비게이션 핸들러 */
interface NavigationHandlers {
  readonly handleSettingsPress: () => void;
  readonly handleViewAllWatchHistory: () => void;
  readonly handleWatchHistoryItemPress: (item: WatchHistoryModelType) => void;
}

interface MyScreenContextType
  extends LoginDialogState,
    CalendarState,
    UserProfileState,
    StatsState,
    NavigationHandlers {}

const MyScreenContext = createContext<MyScreenContextType | undefined>(undefined);

interface MyScreenProviderProps {
  readonly children: ReactNode;
}

export function MyScreenProvider({ children }: MyScreenProviderProps) {
  const navigation = useNavigation<NavigationProp>();

  // 유저 프로필 및 인증 상태
  const { status, displayName, avatarUrl } = useAuth();
  const isGuest = status === 'unauthenticated';

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

  const showLoginDialog = useCallback(() => {
    setLoginDialogVisible(true);
  }, []);

  const hideLoginDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

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
    // MY 설정 클릭 이벤트 로깅
    analyticsService.mySettingsClick();

    navigation.navigate(routePages.settings);
  }, [navigation]);

  // 프로필 클릭 핸들러
  const handleProfilePress = useCallback(() => {
    // MY 프로필 편집 클릭 이벤트 로깅
    analyticsService.myProfileEditClick();

    if (isGuest) {
      setLoginDialogVisible(true);
    } else {
      navigation.navigate(routePages.profileSetup, { mode: 'edit' });
    }
  }, [isGuest, navigation]);

  // 시청 기록 아이템 클릭 핸들러 (콘텐츠 상세 페이지로 이동)
  const handleWatchHistoryItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      // MY 시청 기록 클릭 이벤트 로깅
      analyticsService.myWatchHistoryClick({
        content_id: item.contentId,
        content_type: item.contentType,
      });

      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        type: item.contentType,
        title: item.contentTitle,
        source: ContentSource.MY_WATCH_HISTORY,
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
    // MY 통계 클릭 이벤트 로깅
    analyticsService.myStatsClick({
      stat_type: 'favorites',
      count: favoritesCount,
    });

    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 0 });
  }, [isGuest, navigation, favoritesCount]);

  const handleRatingsPress = useCallback(() => {
    // MY 통계 클릭 이벤트 로깅
    analyticsService.myStatsClick({
      stat_type: 'ratings',
      count: ratingsCount,
    });

    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 1 });
  }, [isGuest, navigation, ratingsCount]);

  const handleWatchedPress = useCallback(() => {
    // MY 통계 클릭 이벤트 로깅
    analyticsService.myStatsClick({
      stat_type: 'watched',
      count: watchedCount,
    });

    if (isGuest) {
      setLoginDialogVisible(true);
      return;
    }
    navigation.navigate(routePages.userContentList, { initialTab: 2 });
  }, [isGuest, navigation, watchedCount]);

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
      // 캘린더 날짜 클릭 이벤트 로깅
      const historyItem = calendarData?.find((item) => item.watchedDate === date);
      analyticsService.myCalendarDateClick({
        date,
        watch_count: historyItem?.count ?? 0,
      });

      if (isGuest) {
        setLoginDialogVisible(true);
        return;
      }
      navigation.navigate(routePages.watchHistory, { date });
    },
    [isGuest, navigation, calendarData],
  );

  const contextValue: MyScreenContextType = useMemo(
    () => ({
      // 로그인 다이얼로그 상태
      isLoginDialogVisible,
      showLoginDialog,
      hideLoginDialog,
      // 캘린더 상태
      selectedYear,
      selectedMonth,
      isMonthPickerVisible,
      calendarData,
      handlePrevMonth,
      handleNextMonth,
      handleOpenMonthPicker,
      handleCloseMonthPicker,
      handleApplyMonthYear,
      handleCalendarDatePress,
      // 사용자 프로필 상태
      isGuest,
      displayName,
      avatarUrl,
      handleProfilePress,
      // 통계 상태
      favoritesCount,
      ratingsCount,
      watchedCount,
      handleFavoritesPress,
      handleRatingsPress,
      handleWatchedPress,
      // 네비게이션 핸들러
      handleSettingsPress,
      handleViewAllWatchHistory,
      handleWatchHistoryItemPress,
    }),
    [
      isLoginDialogVisible,
      showLoginDialog,
      hideLoginDialog,
      selectedYear,
      selectedMonth,
      isMonthPickerVisible,
      calendarData,
      handlePrevMonth,
      handleNextMonth,
      handleOpenMonthPicker,
      handleCloseMonthPicker,
      handleApplyMonthYear,
      handleCalendarDatePress,
      isGuest,
      displayName,
      avatarUrl,
      handleProfilePress,
      favoritesCount,
      ratingsCount,
      watchedCount,
      handleFavoritesPress,
      handleRatingsPress,
      handleWatchedPress,
      handleSettingsPress,
      handleViewAllWatchHistory,
      handleWatchHistoryItemPress,
    ],
  );

  return <MyScreenContext.Provider value={contextValue}>{children}</MyScreenContext.Provider>;
}

/**
 * useMyScreen - MY 탭 화면 Context 접근 훅
 *
 * MyScreenProvider 내부에서만 사용 가능합니다.
 *
 * @example
 * function MyComponent() {
 *   const { isGuest, handleProfilePress } = useMyScreen();
 *   return <Button onPress={handleProfilePress} />;
 * }
 */
export function useMyScreen(): MyScreenContextType {
  const context = useContext(MyScreenContext);
  if (context === undefined) {
    throw new Error('useMyScreen must be used within a MyScreenProvider');
  }
  return context;
}
