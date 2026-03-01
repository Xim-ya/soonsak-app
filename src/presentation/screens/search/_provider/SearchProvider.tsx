import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useSearch } from '../_hooks/useSearch';
import { SearchResultModel } from '../_types/searchResultModel';

/** 디바운스 지연 시간 (ms) */
const DEBOUNCE_DELAY_MS = 350;

interface SearchContextType {
  /** 검색어 */
  searchText: string;
  /** 검색어 설정 함수 */
  setSearchText: (text: string) => void;
  /** 검색어 초기화 함수 */
  clearSearchText: () => void;
  /** 디바운스된 검색어 */
  debouncedSearchText: string;
  /** 검색 결과 */
  results: SearchResultModel[];
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 검색 결과가 비어있는지 여부 */
  isEmpty: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * SearchProvider - 검색 화면의 상태를 관리하는 프로바이더
 *
 * 검색어 입력, 디바운싱, API 호출을 통합 관리합니다.
 *
 * @example
 * <SearchProvider>
 *   <SearchPage />
 * </SearchProvider>
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, DEBOUNCE_DELAY_MS);

  const { data: results, isLoading, error, isEmpty } = useSearch(debouncedSearchText);

  const clearSearchText = () => {
    setSearchText('');
  };

  const contextValue: SearchContextType = useMemo(
    () => ({
      searchText,
      setSearchText,
      clearSearchText,
      debouncedSearchText,
      results,
      isLoading,
      error,
      isEmpty,
    }),
    [searchText, debouncedSearchText, results, isLoading, error, isEmpty],
  );

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
}

/**
 * useSearchContext - SearchProvider의 컨텍스트를 사용하는 훅
 *
 * @throws SearchProvider 외부에서 사용 시 에러 발생
 */
export function useSearchContext(): SearchContextType {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}
