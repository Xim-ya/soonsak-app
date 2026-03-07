/**
 * ContentFilterProvider - 콘텐츠 필터 상태 공유 Context
 *
 * QuickExplorePage와 ExploreScreen 간 필터 상태를 공유합니다.
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { ContentFilter } from '@/core/types/filter/contentFilter';
import { DEFAULT_CONTENT_FILTER, isFilterActive } from '@/core/types/filter/contentFilter';

interface ContentFilterContextType {
  /** 현재 적용된 필터 */
  filter: ContentFilter;
  /** 필터 상태 설정 */
  setFilter: (filter: ContentFilter) => void;
  /** 필터 초기화 */
  resetFilter: () => void;
  /** 필터가 적용되었는지 여부 */
  isFilterApplied: boolean;
}

const ContentFilterContext = createContext<ContentFilterContextType | undefined>(undefined);

interface ContentFilterProviderProps {
  children: ReactNode;
}

/**
 * ContentFilterProvider - 필터 상태를 관리하는 프로바이더
 *
 * @example
 * <ContentFilterProvider>
 *   <MainTabs />
 * </ContentFilterProvider>
 */
function ContentFilterProvider({ children }: ContentFilterProviderProps) {
  const [filter, setFilterState] = useState<ContentFilter>(DEFAULT_CONTENT_FILTER);

  const setFilter = useCallback((newFilter: ContentFilter) => {
    setFilterState(newFilter);
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_CONTENT_FILTER);
  }, []);

  const isFilterApplied = useMemo(() => isFilterActive(filter), [filter]);

  const contextValue: ContentFilterContextType = useMemo(
    () => ({
      filter,
      setFilter,
      resetFilter,
      isFilterApplied,
    }),
    [filter, setFilter, resetFilter, isFilterApplied],
  );

  return (
    <ContentFilterContext.Provider value={contextValue}>{children}</ContentFilterContext.Provider>
  );
}

/**
 * useContentFilter - 필터 상태를 사용하는 커스텀 훅
 */
function useContentFilter(): ContentFilterContextType {
  const context = useContext(ContentFilterContext);
  if (context === undefined) {
    throw new Error('useContentFilter must be used within a ContentFilterProvider');
  }
  return context;
}

export { ContentFilterProvider, useContentFilter };
export type { ContentFilterContextType };
