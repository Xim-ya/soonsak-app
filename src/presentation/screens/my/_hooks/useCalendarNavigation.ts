/**
 * useCalendarNavigation - 캘린더 년/월 네비게이션 Hook
 *
 * 캘린더의 년/월 선택 상태와 네비게이션을 관리합니다.
 */

import { useState, useCallback, useMemo } from 'react';

interface UseCalendarNavigationReturn {
  selectedYear: number;
  selectedMonth: number;
  isMonthPickerVisible: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleOpenMonthPicker: () => void;
  handleCloseMonthPicker: () => void;
  handleApplyMonthYear: (year: number, month: number) => void;
}

export function useCalendarNavigation(): UseCalendarNavigationReturn {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev === 1) {
        setSelectedYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev === 12) {
        setSelectedYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  const handleOpenMonthPicker = useCallback(() => {
    setIsMonthPickerVisible(true);
  }, []);

  const handleCloseMonthPicker = useCallback(() => {
    setIsMonthPickerVisible(false);
  }, []);

  const handleApplyMonthYear = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  return {
    selectedYear,
    selectedMonth,
    isMonthPickerVisible,
    handlePrevMonth,
    handleNextMonth,
    handleOpenMonthPicker,
    handleCloseMonthPicker,
    handleApplyMonthYear,
  };
}
