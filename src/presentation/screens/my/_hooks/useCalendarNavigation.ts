/**
 * useCalendarNavigation - 캘린더 년/월 네비게이션 Hook
 *
 * 캘린더의 년/월 선택 상태와 네비게이션을 관리합니다.
 */

import { useState, useCallback, useMemo } from 'react';
import { analyticsService } from '@/core/services/analytics';

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
      let newMonth: number;
      let newYear = selectedYear;

      if (prev === 1) {
        newYear = selectedYear - 1;
        newMonth = 12;
        setSelectedYear(newYear);
      } else {
        newMonth = prev - 1;
      }

      // 캘린더 월 변경 이벤트 로깅
      analyticsService.myCalendarMonthChange({
        year: newYear,
        month: newMonth,
        navigation_type: 'arrow',
      });

      return newMonth;
    });
  }, [selectedYear]);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      let newMonth: number;
      let newYear = selectedYear;

      if (prev === 12) {
        newYear = selectedYear + 1;
        newMonth = 1;
        setSelectedYear(newYear);
      } else {
        newMonth = prev + 1;
      }

      // 캘린더 월 변경 이벤트 로깅
      analyticsService.myCalendarMonthChange({
        year: newYear,
        month: newMonth,
        navigation_type: 'arrow',
      });

      return newMonth;
    });
  }, [selectedYear]);

  const handleOpenMonthPicker = useCallback(() => {
    setIsMonthPickerVisible(true);
  }, []);

  const handleCloseMonthPicker = useCallback(() => {
    setIsMonthPickerVisible(false);
  }, []);

  const handleApplyMonthYear = useCallback((year: number, month: number) => {
    // 캘린더 월 변경 이벤트 로깅 (swipe는 드롭다운 선택을 의미)
    analyticsService.myCalendarMonthChange({
      year,
      month,
      navigation_type: 'swipe',
    });

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
