/**
 * ChannelProvider - 채널 탭 화면 상태 관리 프로바이더
 *
 * 채널 탭 화면에서 사용되는 공통 상태를 Context로 관리합니다.
 * - 필터 상태 (filter, sheetFilter, hasPendingFilter, isCustomFilterActive)
 * - 필터 바텀시트 상태 (isFilterSheetVisible, openSheet, closeSheet, applyFilter)
 * - 채널 선택 (requestChannelSelection)
 * - 로그인 다이얼로그 상태
 * - 정렬 상태 (sortType)
 *
 * @example
 * <ChannelProvider>
 *   <ChannelContent />
 * </ChannelProvider>
 *
 * // 하위 컴포넌트에서 사용
 * const { filter, sortType, openSheet } = useChannel();
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { ContentFilter } from '@/core/types/filter/contentFilter';
import { useChannelFilterSheet } from '../_hooks/useChannelFilterSheet';
import type { ChannelSortType } from '../_types';

/** 채널 Context 타입 */
interface ChannelContextType {
  // 필터 관련 상태
  /** 현재 적용된 필터 */
  readonly filter: ContentFilter;
  /** 바텀시트에 전달할 필터 (pendingFilter 또는 filter) */
  readonly sheetFilter: ContentFilter;
  /** pendingFilter 존재 여부 (스크롤 위치 유지용) */
  readonly hasPendingFilter: boolean;
  /** 커스텀 필터 적용 여부 (아이콘 뱃지용) */
  readonly isCustomFilterActive: boolean;

  // 필터 바텀시트 상태
  /** 필터 바텀시트 표시 여부 */
  readonly isFilterSheetVisible: boolean;
  /** 필터 바텀시트 열기 */
  readonly openSheet: () => void;
  /** 필터 바텀시트 닫기 */
  readonly closeSheet: () => void;
  /** 필터 적용 */
  readonly applyFilter: (newFilter: ContentFilter) => void;
  /** 채널 선택 페이지로 이동 */
  readonly requestChannelSelection: (tempFilter: ContentFilter) => void;

  // 로그인 다이얼로그 상태
  /** 로그인 다이얼로그 표시 여부 */
  readonly isLoginDialogVisible: boolean;
  /** 로그인 성공 시 실행할 콜백 */
  readonly loginSuccessCallback: (() => void) | undefined;
  /** 로그인 다이얼로그 닫기 */
  readonly closeLoginDialog: () => void;

  // 정렬 상태
  /** 현재 정렬 타입 */
  readonly sortType: ChannelSortType;
  /** 정렬 타입 변경 핸들러 */
  readonly handleSortChange: (newSortType: ChannelSortType) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

interface ChannelProviderProps {
  readonly children: ReactNode;
}

/**
 * ChannelProvider - 채널 탭 화면 상태 관리 프로바이더
 */
export function ChannelProvider({ children }: ChannelProviderProps) {
  // 정렬 상태 (기본값: 전체/랜덤)
  const [sortType, setSortType] = useState<ChannelSortType>('all');

  // 필터 바텀시트 상태 관리
  const {
    filter,
    isVisible: isFilterSheetVisible,
    sheetFilter,
    hasPendingFilter,
    isCustomFilterActive,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
  } = useChannelFilterSheet();

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortType: ChannelSortType) => {
    setSortType(newSortType);
  }, []);

  // Context 값 메모이제이션
  const contextValue: ChannelContextType = useMemo(
    () => ({
      // 필터 관련 상태
      filter,
      sheetFilter,
      hasPendingFilter,
      isCustomFilterActive,

      // 필터 바텀시트 상태
      isFilterSheetVisible,
      openSheet,
      closeSheet,
      applyFilter,
      requestChannelSelection,

      // 로그인 다이얼로그 상태
      isLoginDialogVisible,
      loginSuccessCallback,
      closeLoginDialog,

      // 정렬 상태
      sortType,
      handleSortChange,
    }),
    [
      filter,
      sheetFilter,
      hasPendingFilter,
      isCustomFilterActive,
      isFilterSheetVisible,
      openSheet,
      closeSheet,
      applyFilter,
      requestChannelSelection,
      isLoginDialogVisible,
      loginSuccessCallback,
      closeLoginDialog,
      sortType,
      handleSortChange,
    ],
  );

  return <ChannelContext.Provider value={contextValue}>{children}</ChannelContext.Provider>;
}

/**
 * useChannel - 채널 Context 접근 훅
 *
 * ChannelProvider 내부에서만 사용 가능합니다.
 *
 * @example
 * const { filter, sortType, openSheet } = useChannel();
 */
export function useChannel(): ChannelContextType {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}
