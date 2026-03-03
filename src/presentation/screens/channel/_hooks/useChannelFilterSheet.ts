/**
 * useChannelFilterSheet - 채널 페이지 필터 바텀시트 상태 관리 훅
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
import { analyticsService } from '@/shared/analytics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseChannelFilterSheetReturn {
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
  /** 채널 ID 업데이트 (상단 채널 선택기와 동기화용) */
  updateChannelIds: (channelIds: string[]) => void;
}

export function useChannelFilterSheet(): UseChannelFilterSheetReturn {
  const navigation = useNavigation<NavigationProp>();
  const { filter, setFilter } = useContentFilter();

  const [isVisible, setIsVisible] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<ContentFilter | null>(null);

  // 로그인 다이얼로그 상태
  const [isLoginDialogVisible, setLoginDialogVisible] = useState(false);

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

  // 로그인 다이얼로그 닫기
  const closeLoginDialog = useCallback(() => {
    setLoginDialogVisible(false);
  }, []);

  // 로그인 성공 시 실행할 콜백 (현재 미사용, 추후 필요시 구현)
  const loginSuccessCallback = undefined;

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
      // GA4 channel_selection_open 이벤트 로깅
      analyticsService.channelSelectionOpen({
        current_channel_count: tempFilter.channelIds.length,
        source: 'channel_tab',
      });

      setPendingFilter(tempFilter);
      setIsVisible(false);
      navigation.navigate(routePages.channelSelection, {
        selectedChannelIds: tempFilter.channelIds,
      });
    },
    [navigation],
  );

  // 채널 ID만 업데이트 (상단 채널 선택기와 동기화용)
  const updateChannelIds = useCallback(
    (channelIds: string[]) => {
      setFilter({ ...filter, channelIds });
    },
    [filter, setFilter],
  );

  // 필터가 적용되었는지 확인 (아이콘 뱃지용)
  const isCustomFilterActive = useMemo(
    () =>
      filter.contentType !== null ||
      filter.genreIds.length > 0 ||
      filter.countryCodes.length > 0 ||
      filter.releaseYearRange !== null ||
      filter.minStarRating !== null ||
      filter.includeEnding ||
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
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
    updateChannelIds,
  };
}
