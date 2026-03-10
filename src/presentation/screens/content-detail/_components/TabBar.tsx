import { useState, useCallback, useEffect, useRef } from 'react';
import { View, GestureResponderEvent } from 'react-native';
import styled from '@emotion/native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { TabBarProps, useFocusedTab } from 'react-native-collapsible-tab-view';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import { analyticsService } from '@/core/services/analytics';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';

/** 태블릿 탭바 레이아웃 상수 */
const TABLET_TAB_MAX_WIDTH = 600;

export const TabBar = <T extends string>({
  tabNames,
  indexDecimal,
  onTabPress,
  tabProps,
}: TabBarProps<T>) => {
  // 라이브러리에서 현재 포커스된 탭 가져오기 (초기값용)
  const focusedTab = useFocusedTab();

  // 콘텐츠 ID 가져오기 (GA 로깅용)
  const { id: contentId } = useContentDetailRoute();

  // 플리커링 방지를 위해 자체 상태 관리 (iOS/Android 공통)
  // lazy initializer로 초기값 설정
  const [activeTab, setActiveTab] = useState<T>(() => (focusedTab as T) || tabNames[0]!);

  // 이전 탭 추적 (탭 전환 시 from_tab 판별용)
  const previousTabRef = useRef<T>(activeTab);

  // focusedTab 변경 시 동기화
  useEffect(() => {
    if (focusedTab && focusedTab !== activeTab) {
      setActiveTab(focusedTab as T);
    }
  }, [focusedTab]);

  const handleTabPress = useCallback(
    (name: T) => {
      // 탭 전환 시 GA4 이벤트 로깅 (같은 탭 클릭 시에는 로깅하지 않음)
      if (previousTabRef.current !== name) {
        const tabName = name === '영상' ? 'video_info' : 'related_content';
        const parsedContentId = contentId != null ? Number(contentId) : 0;
        analyticsService.contentDetailTabSwitch({
          tab_name: tabName as 'video_info' | 'related_content',
          content_id: parsedContentId,
        });
        previousTabRef.current = name;
      }

      setActiveTab(name);
      onTabPress(name);
    },
    [onTabPress, contentId],
  );

  // 컴포넌트 내부에서 읽어 AppSize 갱신 반영
  const isLargeScreen = AppSize.isLargeScreen();
  const screenWidth = isLargeScreen ? AppSize.actualScreenWidth : AppSize.screenWidth;
  // 태블릿에서는 탭바 max-width 적용
  const effectiveWidth = isLargeScreen ? Math.min(screenWidth, TABLET_TAB_MAX_WIDTH) : screenWidth;
  const tabWidth = effectiveWidth / tabNames.length;
  const indicatorWidth = tabWidth * 0.38;

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      indexDecimal.value,
      tabNames.map((_, i) => i),
      tabNames.map((_, i) => i * tabWidth + (tabWidth - indicatorWidth) / 2),
    );

    return {
      transform: [{ translateX }],
    };
  });

  // 태블릿 중앙 정렬 스타일
  const tabletContainerStyle = isLargeScreen ? { alignItems: 'center' as const } : undefined;
  const tabletTabsStyle = isLargeScreen ? { width: effectiveWidth } : undefined;

  const getIsActive = (name: T) => activeTab === name;

  // 터치 추적 (responder가 되지 않고 터치 이벤트만 추적)
  const touchStartRef = useRef<{ x: number; y: number; time: number; tabIndex: number } | null>(
    null,
  );
  const tabsContainerRef = useRef<View>(null);
  const containerLeftRef = useRef<number>(0);
  const containerMeasuredRef = useRef<boolean>(false);

  // 탭 컨테이너 레이아웃 측정
  const handleLayout = useCallback(() => {
    tabsContainerRef.current?.measureInWindow((x) => {
      containerLeftRef.current = x;
      containerMeasuredRef.current = true;
    });
  }, []);

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      // 레이아웃 측정 전이면 터치 무시
      if (!containerMeasuredRef.current) return;

      const { pageX, pageY } = e.nativeEvent;
      // pageX에서 컨테이너 왼쪽 위치를 빼서 상대 좌표 계산
      const relativeX = pageX - containerLeftRef.current;
      const tabIndex = Math.floor(relativeX / tabWidth);
      touchStartRef.current = {
        x: pageX,
        y: pageY,
        time: Date.now(),
        tabIndex: Math.min(Math.max(tabIndex, 0), tabNames.length - 1),
      };
    },
    [tabWidth, tabNames.length],
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      if (!touchStartRef.current) return;

      const { pageX, pageY } = e.nativeEvent;
      const { x: startX, y: startY, time: startTime, tabIndex } = touchStartRef.current;
      const elapsed = Date.now() - startTime;
      const deltaX = Math.abs(pageX - startX);

      // 500ms 이내, deltaX 20px 이내 = 탭으로 인식 (deltaY는 헤더 collapse로 인해 무시)
      if (elapsed < 500 && deltaX < 20) {
        const tabName = tabNames[tabIndex];
        if (tabName) {
          handleTabPress(tabName);
        }
      }

      touchStartRef.current = null;
    },
    [tabNames, handleTabPress],
  );

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return (
    <TabBarContainer style={tabletContainerStyle} pointerEvents="box-none">
      <TabsContainer
        ref={tabsContainerRef}
        style={tabletTabsStyle}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {tabNames.map((name) => {
          const tabProp = tabProps?.[name as keyof typeof tabProps];
          const label = (tabProp as { label?: string })?.label || name;

          return (
            <Tab key={name}>
              <TabText isActive={getIsActive(name)}>{label}</TabText>
            </Tab>
          );
        })}
        <Indicator style={indicatorStyle} width={indicatorWidth} />
      </TabsContainer>
    </TabBarContainer>
  );
};

/* Styled Components */
const TabBarContainer = styled.View({
  backgroundColor: colors.black,
  borderBottomWidth: 0.75,
  borderBottomColor: colors.gray06,
});

const TabsContainer = styled.View({
  flexDirection: 'row',
  height: 48,
  position: 'relative',
});

const Tab = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const TabText = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...textStyles.body3,
  color: isActive ? colors.white : colors.gray04,
}));

const Indicator = styled(Animated.View)<{ width: number }>(({ width }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width,
  height: 2,
  backgroundColor: colors.main,
}));
