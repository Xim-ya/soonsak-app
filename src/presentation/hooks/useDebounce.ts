import { useState, useEffect } from 'react';

/**
 * 값의 변경을 지정된 시간만큼 지연시키는 훅
 *
 * @param value 디바운스할 값
 * @param delay 지연 시간 (밀리초, 기본값: 350ms)
 * @returns 디바운스된 값
 *
 * @example
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearchText = useDebounce(searchText, 350);
 *
 * useEffect(() => {
 *   // debouncedSearchText가 변경될 때만 API 호출
 *   if (debouncedSearchText) {
 *     fetchSearchResults(debouncedSearchText);
 *   }
 * }, [debouncedSearchText]);
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
