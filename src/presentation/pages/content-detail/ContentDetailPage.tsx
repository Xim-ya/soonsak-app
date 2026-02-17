import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { BasePage } from '../../components/page';
import { Header } from './_components';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { DarkedLinearShadow, LinearAlign } from '../../components/shadow/DarkedLinearShadow';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useCallback } from 'react';
import { TabBar } from './_components/TabBar';
import { ContentTabView } from './_components/VideoTabView';
import { RelatedContentTabView } from './_components/OriginContentTabView';
import { AnimatedAppBar } from './_components/AnimatedAppBar';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentDetailProvider } from './_provider/ContentDetailProvider';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { FavoriteActionBottomSheet } from '@/presentation/components/bottom-sheet/FavoriteActionBottomSheet';
import { useFavoriteAction } from './_hooks/useFavoriteAction';

export default function ContentDetailPage() {
  const route = useRoute<ScreenRouteProp<typeof routePages.contentDetail>>();
  const { id, type, videoId } = route.params;
  const insets = useSafeAreaInsets();
  const appBarOpacity = useSharedValue(0);

  const contentId = Number(id);
  const contentType = type as ContentType;

  // iOS WKWebView 전체화면 버그 대응: 포커스 복귀 시 portrait 잠금 + dimensions 강제 복구
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).then(() => {
          AppSize.forceRefreshDimensions();
        });
      }
    }, []),
  );

  // 찜하기 액션 관련 상태 및 핸들러 (Discussion #42: 다이얼로그 상태 훅 분리)
  const {
    isFavorited,
    isToggling,
    isLoginDialogVisible,
    isActionSheetVisible,
    handleMorePress,
    handleToggleFavorite,
    handleCloseActionSheet,
    handleCloseDialog,
  } = useFavoriteAction({ contentId, contentType });

  // 스크롤 오프셋 변화 처리 - 메모이제이션으로 리렌더링 최적화
  const handleScrollChange = useCallback(
    (offset: number) => {
      // y offset이 269 이상이면 opacity 1.0, 미만이면 0.0
      const targetOpacity = offset >= 269.0 ? 1.0 : 0.0;
      // 현재 opacity와 다를 때만 애니메이션 실행 (성능 최적화)
      if (Math.abs(appBarOpacity.value - targetOpacity) > 0.01) {
        appBarOpacity.value = withTiming(targetOpacity, {
          duration: 400,
        });
      }
    },
    [appBarOpacity],
  );

  return (
    <ContentDetailProvider contentId={contentId} contentType={contentType} videoId={videoId}>
      <BasePage
        useSafeArea={false}
        touchableWithoutFeedback={false}
        automaticallyAdjustKeyboardInsets={false}
        dismissKeyboardOnTap={false}
      >
        <GradientContainer safeAreaHeight={insets.top}>
          <DarkedLinearShadow height={insets.top + 140} align={LinearAlign.topBottom} />
        </GradientContainer>
        <BackgroundContainer
          style={useAnimatedStyle(() => {
            'worklet';
            return {
              backgroundColor: `rgba(0,0,0,${appBarOpacity.value})`,
            };
          }, [appBarOpacity])}
          safeAreaHeight={insets.top}
        />
        <AnimatedAppBar insets={insets} opacity={appBarOpacity} onMorePress={handleMorePress} />
        <TabsContainer paddingTop={insets.top}>
          <Tabs.Container
            renderHeader={() => <Header />}
            renderTabBar={(props) => <TabBar {...props} />}
            allowHeaderOverscroll={true}
            headerHeight={480}
            tabBarHeight={48}
            minHeaderHeight={48}
            width={AppSize.screenWidth}
          >
            <Tabs.Tab name="영상" label="videoInfo">
              <ContentTabView onScrollChange={handleScrollChange} />
            </Tabs.Tab>
            <Tabs.Tab name="관련 콘텐츠" label="relatedContent">
              <RelatedContentTabView onScrollChange={handleScrollChange} />
            </Tabs.Tab>
          </Tabs.Container>
        </TabsContainer>
      </BasePage>

      {/* 찜하기 액션 바텀시트 */}
      <FavoriteActionBottomSheet
        visible={isActionSheetVisible}
        isFavorited={isFavorited}
        disabled={isToggling}
        onToggleFavorite={handleToggleFavorite}
        onClose={handleCloseActionSheet}
      />

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog visible={isLoginDialogVisible} onClose={handleCloseDialog} />
    </ContentDetailProvider>
  );
}

/* Styled Components */
const GradientContainer = styled(Animated.View)<{ safeAreaHeight: number }>(
  ({ safeAreaHeight }) => ({
    position: 'absolute',
    top: 0, // SafeArea 포함하여 최상단부터 시작
    left: 0,
    right: 0,
    height: safeAreaHeight + 140, // SafeArea 높이 + 그라데이션 높이
    zIndex: 997, // AppBar보다 낮은 z-index
    pointerEvents: 'none',
  }),
);

const BackgroundContainer = styled(Animated.View)<{ safeAreaHeight: number }>(
  ({ safeAreaHeight }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: safeAreaHeight + 48, // SafeArea 높이 + AppBar 높이
    zIndex: 998, // 그라데이션보다 높고, BackButtonAppBar보다 낮음
  }),
);

const TabsContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flex: 1,
  backgroundColor: colors.black,
  paddingTop,
}));
