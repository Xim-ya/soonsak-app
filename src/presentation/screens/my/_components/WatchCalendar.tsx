/**
 * WatchCalendar - 시청 작품 캘린더
 *
 * 월별 캘린더 형태로 시청 기록을 표시합니다.
 * - 시청한 날에는 포스터 이미지 표시
 * - 같은 날 2개 이상 시청 시 우측 하단에 카운트 배지 표시
 * - 년/월 선택 버튼으로 월 이동 가능
 */

import { memo, useMemo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import type { WatchHistoryCalendarItemDto } from '@/features/watch-history';
import BackArrowIcon from '@assets/icons/back_arrow.svg';

interface WatchCalendarProps {
  /** 현재 선택된 년도 */
  readonly year: number;
  /** 현재 선택된 월 (1-12) */
  readonly month: number;
  /** 해당 월의 시청 기록 */
  readonly calendarData: WatchHistoryCalendarItemDto[] | undefined;
  /** 이전 월로 이동 */
  readonly onPrevMonth: () => void;
  /** 다음 월로 이동 */
  readonly onNextMonth: () => void;
  /** 년/월 선택기 열기 */
  readonly onOpenMonthPicker: () => void;
  /** 날짜 클릭 콜백 */
  readonly onDatePress?: (date: string) => void;
}

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'] as const;
const CALENDAR_PADDING = AppSize.ratioWidth(16);
const CELL_GAP = AppSize.ratioWidth(4);
const CELL_WIDTH = Math.floor((AppSize.screenWidth - CALENDAR_PADDING * 2 - CELL_GAP * 6) / 7);
const CELL_HEIGHT = Math.floor(CELL_WIDTH * 1.5); // 포스터 비율 2:3
const ARROW_SIZE = 24;

function WatchCalendarComponent({
  year,
  month,
  calendarData,
  onPrevMonth,
  onNextMonth,
  onOpenMonthPicker,
  onDatePress,
}: WatchCalendarProps) {
  // 월의 첫째 날과 마지막 날 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // 날짜별 시청 기록 맵 생성
    const historyMap = new Map<string, WatchHistoryCalendarItemDto>();
    (calendarData ?? []).forEach((item) => {
      historyMap.set(item.watchedDate, item);
    });

    // 캘린더 그리드 데이터 생성
    const days: CalendarDay[] = [];

    // 이전 달의 빈 셀
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ type: 'empty', key: `empty-start-${i}` });
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const history = historyMap.get(dateStr);

      days.push({
        type: 'date',
        key: dateStr,
        day,
        dateStr,
        history,
      });
    }

    return days;
  }, [year, month, calendarData]);

  const handleDatePress = useCallback(
    (dateStr: string) => {
      onDatePress?.(dateStr);
    },
    [onDatePress],
  );

  return (
    <Container>
      {/* 월 네비게이션 */}
      <MonthNavigation>
        <NavButton
          onPress={onPrevMonth}
          activeOpacity={0.7}
          accessibilityLabel="이전 달"
          accessibilityRole="button"
        >
          <BackArrowIcon width={ARROW_SIZE} height={ARROW_SIZE} color={colors.white} />
        </NavButton>

        <MonthPillButton onPress={onOpenMonthPicker} activeOpacity={0.7}>
          <MonthText>
            {year}년 {month}월
          </MonthText>
          <DropdownIcon>▼</DropdownIcon>
        </MonthPillButton>

        <NavButton
          onPress={onNextMonth}
          activeOpacity={0.7}
          accessibilityLabel="다음 달"
          accessibilityRole="button"
        >
          <NextArrowIcon>
            <BackArrowIcon width={ARROW_SIZE} height={ARROW_SIZE} color={colors.white} />
          </NextArrowIcon>
        </NavButton>
      </MonthNavigation>

      {/* 요일 헤더 */}
      <WeekDaysRow>
        {DAYS_OF_WEEK.map((day, index) => (
          <WeekDayCell key={day} style={{ marginRight: index === 6 ? 0 : CELL_GAP }}>
            <WeekDayText>{day}</WeekDayText>
          </WeekDayCell>
        ))}
      </WeekDaysRow>

      {/* 캘린더 그리드 */}
      <CalendarGrid>
        {calendarDays.map((item, index) => {
          const isLastInRow = index % 7 === 6;
          const cellMarginStyle = { marginRight: isLastInRow ? 0 : CELL_GAP };

          if (item.type === 'empty') {
            return <EmptyCell key={item.key} style={cellMarginStyle} />;
          }

          const hasHistory = !!item.history;
          const count = item.history?.count ?? 0;
          const posterPath = item.history?.firstPosterPath;

          // 시청 기록이 없는 셀은 일반 View로 렌더링 (스크롤 제스처 방해 방지)
          if (!hasHistory) {
            return (
              <EmptyDateCell key={item.key} style={cellMarginStyle}>
                <DayNumber>{item.day}</DayNumber>
              </EmptyDateCell>
            );
          }

          return (
            <DateCell
              key={item.key}
              style={cellMarginStyle}
              onPress={() => handleDatePress(item.dateStr)}
              activeOpacity={0.7}
            >
              {posterPath ? (
                <PosterContainer>
                  <LoadableImageView
                    source={formatter.prefixTmdbImgUrl(posterPath, { size: TmdbImageSize.w92 })}
                    width={CELL_WIDTH}
                    height={CELL_HEIGHT}
                    borderRadius={4}
                  />
                  {count > 1 && (
                    <CountBadge>
                      <CountText>{count}</CountText>
                    </CountBadge>
                  )}
                </PosterContainer>
              ) : (
                <DayNumber>{item.day}</DayNumber>
              )}
            </DateCell>
          );
        })}
      </CalendarGrid>
    </Container>
  );
}

/* Types */

type CalendarDay =
  | { type: 'empty'; key: string }
  | {
      type: 'date';
      key: string;
      day: number;
      dateStr: string;
      history?: WatchHistoryCalendarItemDto | undefined;
    };

/* Styled Components */

const Container = styled.View({
  paddingHorizontal: CALENDAR_PADDING,
  paddingVertical: AppSize.ratioHeight(16),
});

const MonthNavigation = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: AppSize.ratioHeight(16),
});

const NavButton = styled(TouchableOpacity)({
  width: 48,
  height: 48,
  alignItems: 'center',
  justifyContent: 'center',
});

const NextArrowIcon = styled.View({
  transform: [{ rotate: '180deg' }],
});

const MonthPillButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray06,
  paddingHorizontal: AppSize.ratioWidth(16),
  paddingVertical: AppSize.ratioHeight(8),
  borderRadius: 20,
});

const MonthText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
});

const DropdownIcon = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  marginLeft: AppSize.ratioWidth(8),
});

const WeekDaysRow = styled.View({
  flexDirection: 'row',
  marginBottom: AppSize.ratioHeight(8),
});

const WeekDayCell = styled.View({
  width: CELL_WIDTH,
  alignItems: 'center',
});

const WeekDayText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

const CalendarGrid = styled.View({
  flexDirection: 'row',
  flexWrap: 'wrap',
});

const EmptyCell = styled.View({
  width: CELL_WIDTH,
  height: CELL_HEIGHT,
  marginBottom: CELL_GAP,
});

const EmptyDateCell = styled.View({
  width: CELL_WIDTH,
  height: CELL_HEIGHT,
  marginBottom: CELL_GAP,
  alignItems: 'center',
  justifyContent: 'center',
});

const DateCell = styled(TouchableOpacity)({
  width: CELL_WIDTH,
  height: CELL_HEIGHT,
  marginBottom: CELL_GAP,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.gray07,
  borderRadius: 4,
});

const DayNumber = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
});

const PosterContainer = styled.View({
  width: CELL_WIDTH,
  height: CELL_HEIGHT,
  position: 'relative',
});

const CountBadge = styled.View({
  position: 'absolute',
  bottom: 4,
  right: 4,
  minWidth: 18,
  height: 18,
  backgroundColor: colors.main,
  borderRadius: 9,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 4,
});

const CountText = styled.Text({
  ...textStyles.desc,
  color: colors.black,
  fontWeight: 'bold',
});

export const WatchCalendar = memo(WatchCalendarComponent);
