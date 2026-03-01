/**
 * useExploreFilterSheet - 탐색 화면 필터 바텀시트 상태 관리 훅
 *
 * 필터 바텀시트의 열기/닫기, 채널 선택 페이지 연동,
 * 필터 적용 등의 로직을 캡슐화합니다.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import { useContentFilter } from '@/shared/context/ContentFilterContext';
import { channelSelectionBridge } from '@/features/channel/utils/channelSelectionBridge';
import { useAuth } from '@/shared/providers/AuthProvider';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 로그인이 필요한 필터 액션 타입 */
type PendingFilterAction = 'excludeWatched';

interface UseExploreFilterSheetReturn {
  /** 현재 필터 상태 */
  filter: ContentFilter;
  /** 바텀시트 표시 여부 */
  isVisible: boolean;
  /** 바텀시트에 전달할 필터 (pendingFilter 또는 filter) */
  sheetFilter: ContentFilter;
  /** pendingFilter 존재 여부 (스크롤 위치 유지용) */
  hasPendingFilter: boolean;
  /** 커스텀 필터 적용 여부 (아이콘 뱃지용) */
  isCustomFilterActive: boolean;
  /** 결말포함 토글 */
  toggleIncludeEnding: () => void;
  /** 본 작품 제외 토글 (로그인 체크 포함) */
  toggleExcludeWatched: () => void;
  /** 필터 버튼 클릭 (바텀시트 열기) */
  openSheet: () => void;
  /** 바텀시트 닫기 */
  closeSheet: () => void;
  /** 필터 적용 */
  applyFilter: (newFilter: ContentFilter) => void;
  /** 채널 선택 페이지로 이동 */
  requestChannelSelection: (tempFilter: ContentFilter) => void;
  /** 로그인 다이얼로그 표시 여부 */
  isLoginDialogVisible: boolean;
  /** 로그인 성공 시 실행할 콜백 */
  loginSuccessCallback: (() => void) | undefined;
  /** 로그인 다이얼로그 닫기 */
  closeLoginDialog: () => void;
}

export function useExploreFilterSheet(): UseExploreFilterSheetReturn {
  const navigation = useNavigation<NavigationProp>();
  const { filter, setFilter } = useContentFilter();
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';

  const [isVisible, setIsVisible] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<ContentFilter | null>(null);

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingFilterAction | null>(null);

  // pendingFilter의 최신 값을 ref로 유지 (useFocusEffect 의존성 제거)
  const pendingFilterRef = useRef<ContentFilter | null>(null);
  pendingFilterRef.current = pendingFilter;

  // 채널 선택 페이지에서 복귀 시 결과 처리
  useFocusEffect(
    useCallback(() => {
      const current = pendingFilterRef.current;
      if (current === null) return;

      const channelResult = channelSelectionBridge.consumeChannelResult();
      if (channelResult !== null) {
        setPendingFilter({ ...current, channelIds: channelResult });
      }
      setIsVisible(true);
    }, []),
  );

  const toggleIncludeEnding = useCallback(() => {
    setFilter({ ...filter, includeEnding: !filter.includeEnding });
  }, [filter, setFilter]);

  // 본 작품 제외 토글 (로그인 체크 포함)
  const toggleExcludeWatched = useCallback(() => {
    if (!isLoggedIn) {
      setPendingAction('excludeWatched');
      setLoginDialogVisible(true);
      return;
    }
    setFilter({ ...filter, excludeWatched: !filter.excludeWatched });
  }, [isLoggedIn, filter, setFilter]);

  // 로그인 다이얼로그 닫기
  const closeLoginDialog = useCallback(() => {
    setLoginDialogVisible(false);
    setPendingAction(null);
  }, []);

  // 로그인 성공 시 실행할 콜백
  const loginSuccessCallback = useMemo(() => {
    if (pendingAction === 'excludeWatched') {
      return () => {
        setFilter({ ...filter, excludeWatched: true });
        setPendingAction(null);
      };
    }
    return undefined;
  }, [pendingAction, filter, setFilter]);

  const openSheet = useCallback(() => {
    setPendingFilter(null);
    setIsVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setPendingFilter(null);
    setIsVisible(false);
  }, []);

  const applyFilter = useCallback(
    (newFilter: ContentFilter) => {
      setFilter(newFilter);
      setPendingFilter(null);
      setIsVisible(false);
    },
    [setFilter],
  );

  const requestChannelSelection = useCallback(
    (tempFilter: ContentFilter) => {
      setPendingFilter(tempFilter);
      setIsVisible(false);
      navigation.navigate(routePages.channelSelection, {
        selectedChannelIds: tempFilter.channelIds,
      });
    },
    [navigation],
  );

  // includeEnding 외의 필터가 적용되었는지 확인 (excludeWatched 포함)
  const isCustomFilterActive = useMemo(
    () =>
      filter.contentType !== null ||
      filter.genreIds.length > 0 ||
      filter.countryCodes.length > 0 ||
      filter.releaseYearRange !== null ||
      filter.minStarRating !== null ||
      filter.channelIds.length > 0 ||
      filter.excludeWatched,
    [filter],
  );

  return {
    filter,
    isVisible,
    sheetFilter: pendingFilter ?? filter,
    hasPendingFilter: pendingFilter !== null,
    isCustomFilterActive,
    toggleIncludeEnding,
    toggleExcludeWatched,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
  };
}
