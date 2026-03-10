import { Text, Pressable, View } from 'react-native';
import styled from '@emotion/native';
import { formatter } from '@/core/utils/formatter';
import { FadeInImage } from '@/presentation/components/image/FadeInImage';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { useCallback, useMemo, useState } from 'react';
import { DotStyle } from 'react-native-reanimated-carousel/lib/typescript/components/Pagination/Basic/PaginationItem';
import { EmptyView } from '@/presentation/components/view/EmptyView';
import textStyle from '@/presentation/styles/textStyles';
import Gap from '@/presentation/components/view/Gap';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import colors from '@/presentation/styles/colors';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useTopBannerContents } from '../_hooks/useTopBannerContents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/core/services/analytics';
import { TopContentModel } from '../_types/TopContentModel';
import { AppImage, ContentFit } from '@/presentation/components/image/AppImage';
import { AppSize } from '@/presentation/utils/appSize';
import { LinearGradient } from 'expo-linear-gradient';

/** 로고 사이즈 */
const LOGO_WIDTH = 200;
const LOGO_HEIGHT = 60;

/** 태블릿용 로고 사이즈 (카드 내부) */
const TABLET_LOGO_WIDTH = 160;
const TABLET_LOGO_HEIGHT = 48;

/** 태블릿 캐러셀 레이아웃 설정 (왓차 스타일) */
const TABLET_LAYOUT = {
  /** 첫 번째 배너 너비 비율 (화면의 62%) */
  PRIMARY_WIDTH_RATIO: 0.62,
  /** 좌측 여백 */
  LEFT_PADDING: 24,
  /** 상단 여백 */
  TOP_PADDING: 16,
  /** 아이템 간 간격 */
  ITEM_GAP: 12,
  /** 카드 둥근 모서리 */
  BORDER_RADIUS: 12,
  /** 배너 높이 비율 (3:4 세로 포스터 스타일) */
  ASPECT_RATIO: 3 / 4,
} as const;

/** Phone 레이아웃 상수 */
const PHONE_LAYOUT = {
  ASPECT_RATIO: 375 / 500,
} as const;

/** 디바이스별 레이아웃 계산 */
const isLargeScreen = AppSize.isLargeScreen();
const screenWidth = AppSize.actualScreenWidth;

// 태블릿: 왓차 스타일
const tabletItemWidth = screenWidth * TABLET_LAYOUT.PRIMARY_WIDTH_RATIO;
const tabletHeight = tabletItemWidth / TABLET_LAYOUT.ASPECT_RATIO;

// 폰: 기존 스타일
const phoneHeight = screenWidth / PHONE_LAYOUT.ASPECT_RATIO;

// 사용할 높이
const bannerHeight = isLargeScreen ? tabletHeight : phoneHeight;

/** 타이틀 영역: 로고 있으면 로고, 없거나 에러면 텍스트 (폰용) */
interface TitleWithLogoProps {
  title: string;
  logoUrl: string | null;
}

function TitleWithLogo({ title, logoUrl }: TitleWithLogoProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!logoUrl || hasError) {
    return (
      <Title numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Title>
    );
  }

  return (
    <LogoContainer>
      <AppImage
        source={formatter.prefixTmdbImgUrl(logoUrl)}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        contentFit={ContentFit.Contain}
        transition={200}
        transparent
        onError={handleError}
      />
    </LogoContainer>
  );
}

/** 태블릿용 배너 카드 내부 타이틀 */
interface TabletTitleWithLogoProps {
  title: string;
  logoUrl: string | null;
}

function TabletTitleWithLogo({ title, logoUrl }: TabletTitleWithLogoProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!logoUrl || hasError) {
    return (
      <TabletCardTitle numberOfLines={2} ellipsizeMode="tail">
        {title}
      </TabletCardTitle>
    );
  }

  return (
    <TabletLogoContainer>
      <AppImage
        source={formatter.prefixTmdbImgUrl(logoUrl)}
        width={TABLET_LOGO_WIDTH}
        height={TABLET_LOGO_HEIGHT}
        contentFit={ContentFit.Contain}
        transition={200}
        transparent
        onError={handleError}
      />
    </TabletLogoContainer>
  );
}

interface HeaderProps {
  scrollY?: SharedValue<number>;
}

/**
 * 최신/대표 콘텐츠 들이 스와이프 형태로 노출 되는 뷰
 * - Phone: 전체 너비 배너 + 고정 위치 제목
 * - Tablet: 왓차 스타일 - 각 카드 내부에 그라데이션/제목 포함
 */
export function Header({ scrollY }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    headerInfo,
    currentItem,
    isError,
    isLoading,
    ref,
    progress,
    infoOpacity,
    onPressPagination,
    onProgressChange,
    onSnapToItem,
    onGestureStart,
    handleRetry,
  } = useTopBannerContents();

  const handleContentPress = useCallback(
    (item: TopContentModel, bannerIndex: number) => {
      // 배너 클릭 이벤트 로깅
      analyticsService.homeBannerClick({
        content_id: item.id,
        content_type: item.type,
        banner_index: bannerIndex,
      });

      navigation.navigate(routePages.contentDetail, {
        id: item.id,
        type: item.type,
        title: item.title,
        source: ContentSource.HOME_BANNER,
        initialData: {
          backdropPath: item.backdropPath,
          posterPath: item.posterPath,
        },
      });
    },
    [navigation],
  );

  // 위로 당길 때 백드롭 이미지 scale 증가
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const scale = interpolate(scrollY.value, [-200, 0], [1.2, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [-200, 0], [-20, 0], Extrapolation.CLAMP);

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  /** 키워드 목록 렌더링 (폰용) */
  const keywordElements = useMemo(() => {
    const keywords = currentItem?.keywords;
    if (!keywords || keywords.length === 0) return null;

    return keywords.map((keyword, index) => {
      const isLast = index === keywords.length - 1;
      return (
        <CategoryItem key={`${currentItem.id}-${keyword}-${index}`}>
          {keyword}
          {!isLast && ' . '}
        </CategoryItem>
      );
    });
  }, [currentItem?.id, currentItem?.keywords]);

  /** 태블릿 배너 카드 렌더링 */
  const renderTabletBannerCard = useCallback(
    ({ item, index }: { item: TopContentModel; index: number }) => {
      const keywords = item.keywords ?? [];
      const keywordText = keywords.join(' · ');

      return (
        <TabletCardContainer
          style={{ width: tabletItemWidth, height: tabletHeight }}
          onPress={() => handleContentPress(item, index)}
          activeOpacity={0.9}
        >
          {/* 배경 이미지 */}
          {item.backdropImgUrl ? (
            <FadeInImage
              key={`${item.id}-${item.type}`}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              source={{ uri: formatter.prefixTmdbImgUrl(item.backdropImgUrl) }}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: colors.gray05 }} />
          )}

          {/* 하단 그라데이션 */}
          <TabletGradientOverlay colors={['transparent', 'rgba(0,0,0,0.8)']} locations={[0.3, 1]} />

          {/* 카드 내부 콘텐츠 정보 */}
          <TabletCardInfoContainer>
            {item.pointDescription && (
              <TabletPointDescription numberOfLines={2}>
                {item.pointDescription}
              </TabletPointDescription>
            )}
            <TabletTitleWithLogo title={item.title} logoUrl={item.logoUrl ?? null} />
            {keywordText && <TabletKeywords numberOfLines={1}>{keywordText}</TabletKeywords>}
          </TabletCardInfoContainer>
        </TabletCardContainer>
      );
    },
    [handleContentPress],
  );

  /** 폰 배너 카드 렌더링 */
  const renderPhoneBannerCard = useCallback(
    ({ item, index }: { item: TopContentModel; index: number }) => (
      <Pressable onPress={() => handleContentPress(item, index)}>
        {item.backdropImgUrl ? (
          <FadeInImage
            key={`${item.id}-${item.type}`}
            style={{ width: '100%', height: phoneHeight }}
            source={{ uri: formatter.prefixTmdbImgUrl(item.backdropImgUrl) }}
          />
        ) : (
          <View style={{ height: phoneHeight, backgroundColor: colors.gray05 }} />
        )}
      </Pressable>
    ),
    [handleContentPress],
  );

  // 로딩 중
  if (isLoading) {
    return <HeaderBox isLargeScreen={isLargeScreen} />;
  }

  // 에러 상태
  if (isError) {
    return (
      <HeaderBox isLargeScreen={isLargeScreen}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.gray03, marginBottom: 12 }}>
            콘텐츠를 불러올 수 없습니다
          </Text>
          <Pressable onPress={handleRetry}>
            <Text style={{ color: colors.white, textDecorationLine: 'underline' }}>다시 시도</Text>
          </Pressable>
        </SafeAreaView>
      </HeaderBox>
    );
  }

  // 빈 데이터
  if (!headerInfo || headerInfo.length === 0) {
    return (
      <SafeAreaView>
        <EmptyView />
      </SafeAreaView>
    );
  }

  // 태블릿 레이아웃 (왓차 스타일)
  if (isLargeScreen) {
    // 스냅 너비 = 카드 너비 + 간격
    const snapWidth = tabletItemWidth + TABLET_LAYOUT.ITEM_GAP;
    // 전체 높이 = 상단 마진 + 배너 높이 + 인디케이터 공간
    const totalHeight = TABLET_LAYOUT.TOP_PADDING + tabletHeight + 48;

    return (
      <TabletHeaderBox style={{ height: totalHeight }}>
        <Animated.View style={[backdropAnimatedStyle, { marginTop: TABLET_LAYOUT.TOP_PADDING }]}>
          <Carousel
            ref={ref}
            width={snapWidth}
            height={tabletHeight}
            style={{
              width: screenWidth,
              paddingLeft: TABLET_LAYOUT.LEFT_PADDING,
            }}
            data={headerInfo}
            onProgressChange={onProgressChange}
            onSnapToItem={onSnapToItem}
            autoPlay={true}
            autoPlayInterval={4000}
            loop={true}
            overscrollEnabled={true}
            onConfigurePanGesture={(panGesture) => {
              panGesture
                .activeOffsetX([-10, 10])
                .failOffsetY([-5, 5])
                .onStart(() => {
                  'worklet';
                  runOnJS(onGestureStart)();
                });
            }}
            renderItem={renderTabletBannerCard}
          />
        </Animated.View>

        {/* 페이지 인디케이터 */}
        <TabletIndicator>
          <Pagination.Basic
            progress={progress}
            data={headerInfo}
            dotStyle={dotStyle(colors.gray05)}
            activeDotStyle={dotStyle(colors.gray02)}
            containerStyle={{ gap: 6 }}
            onPress={onPressPagination}
          />
        </TabletIndicator>
      </TabletHeaderBox>
    );
  }

  // 폰 레이아웃 (기존)
  return (
    <HeaderBox isLargeScreen={false}>
      <Animated.View style={backdropAnimatedStyle}>
        <Carousel
          ref={ref}
          width={screenWidth}
          height={phoneHeight}
          data={headerInfo}
          onProgressChange={onProgressChange}
          onSnapToItem={onSnapToItem}
          autoPlay={true}
          autoPlayInterval={3000}
          onConfigurePanGesture={(panGesture) => {
            panGesture
              .activeOffsetX([-10, 10])
              .failOffsetY([-5, 5])
              .onStart(() => {
                'worklet';
                runOnJS(onGestureStart)();
              });
          }}
          renderItem={renderPhoneBannerCard}
        />
      </Animated.View>

      {/* 하단 그라데이션 */}
      <DarkedLinearShadow align={LinearAlign.bottomTop} height={178} />

      {/* 콘텐츠 정보 */}
      <FixedInfoView>
        <AnimatedInfoContainer style={{ opacity: infoOpacity }}>
          <PointDescription numberOfLines={2} ellipsizeMode="tail">
            {currentItem?.pointDescription}
          </PointDescription>
          <TitleWithLogo
            key={currentItem?.id}
            title={currentItem?.title ?? ''}
            logoUrl={currentItem?.logoUrl ?? null}
          />
          <CategoryListView>{keywordElements}</CategoryListView>
          <Gap size={28} />
        </AnimatedInfoContainer>
      </FixedInfoView>

      <Indicator>
        <Pagination.Basic
          progress={progress}
          data={headerInfo}
          dotStyle={dotStyle(colors.gray05)}
          activeDotStyle={dotStyle(colors.gray02)}
          containerStyle={{ gap: 4 }}
          onPress={onPressPagination}
        />
      </Indicator>

      {/* 상단 그라데이션 */}
      <DarkedLinearShadow align={LinearAlign.topBottom} height={178} />
    </HeaderBox>
  );
}

/* Styles */
const dotStyle: (backgroundColor: string) => DotStyle = (backgroundColor) => ({
  backgroundColor,
  borderRadius: 4,
  height: 4,
  width: 4,
});

/* Phone Styles */
const HeaderBox = styled.View<{ isLargeScreen: boolean }>(({ isLargeScreen: large }) => ({
  aspectRatio: large ? undefined : PHONE_LAYOUT.ASPECT_RATIO,
  height: large ? bannerHeight : undefined,
  alignSelf: 'stretch',
  width: '100%',
  overflow: 'hidden',
}));

const FixedInfoView = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  alignItems: 'center',
  paddingHorizontal: 36,
  pointerEvents: 'none',
});

const AnimatedInfoContainer = Animated.createAnimatedComponent(
  styled.View({
    alignItems: 'center',
    width: '100%',
  }),
);

const PointDescription = styled.Text({
  color: colors.green,
  ...textStyle.body1,
  marginBottom: 1,
  textAlign: 'center',
  textAlignVertical: 'center',
});

const Title = styled.Text({
  color: colors.white,
  ...textStyle.highlight,
  lineHeight: 36,
  marginBottom: 8,
  textAlign: 'center',
  textAlignVertical: 'center',
});

const LogoContainer = styled.View({
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: LOGO_HEIGHT,
  marginBottom: 8,
});

const CategoryListView = styled.View({
  display: 'flex',
  flexDirection: 'row',
});

const CategoryItem = styled.Text({
  color: colors.gray03,
  ...textStyle.desc,
});

const Indicator = styled.View({
  marginTop: 16,
  marginBottom: 8,
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  alignItems: 'center',
});

/* Tablet Styles (왓차 스타일) */
const TabletHeaderBox = styled.View({
  width: '100%',
  overflow: 'visible',
});

const TabletCardContainer = styled.TouchableOpacity({
  borderRadius: TABLET_LAYOUT.BORDER_RADIUS,
  overflow: 'hidden',
  marginRight: TABLET_LAYOUT.ITEM_GAP,
});

const TabletGradientOverlay = styled(LinearGradient)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '60%',
});

const TabletCardInfoContainer = styled.View({
  position: 'absolute',
  left: 20,
  right: 20,
  bottom: 20,
});

const TabletPointDescription = styled.Text(() => ({
  ...textStyle.alert1,
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: 2,
}));

const TabletCardTitle = styled.Text({
  color: colors.white,
  ...textStyle.headline1,
  marginBottom: 4,
});

const TabletLogoContainer = styled.View({
  marginBottom: 4,
});

const TabletKeywords = styled.Text(() => ({
  ...textStyle.desc,
  color: colors.gray01,
}));

const TabletIndicator = styled.View({
  alignItems: 'center',
  marginTop: 16,
});
