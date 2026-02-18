import { Text, Dimensions, Pressable, View } from 'react-native';
import styled from '@emotion/native';
import { formatter } from '@/shared/utils/formatter';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import React, { useCallback } from 'react';
import { DotStyle } from 'react-native-reanimated-carousel/lib/typescript/components/Pagination/Basic/PaginationItem';
import { EmptyView } from '@/presentation/components/view/EmptyView';
import textStyle from '@/shared/styles/textStyles';
import Gap from '@/presentation/components/view/Gap';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import colors from '@/shared/styles/colors';
import Animated from 'react-native-reanimated';
import { useTopBannerContents } from '../_hooks/useTopBannerContents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { TopContentModel } from '../_types/TopContentModel';

/**
 * 최신/대표 콘텐츠 들이 스와이프 형태로 노출 되는 뷰
 * */
export function Header() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    headerInfo,
    currentItem,
    isError,
    ref,
    progress,
    infoOpacity,
    onPressPagination,
    onProgressChange,
    onSnapToItem,
    handleRetry,
  } = useTopBannerContents();

  const handleContentPress = useCallback(
    (item: TopContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: item.id,
        type: item.type,
      });
    },
    [navigation],
  );

  /** 키워드 목록 렌더링 */
  const renderKeywords = () => {
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
  };

  // 에러 상태 처리 (재시도 버튼 포함)
  if (isError) {
    return (
      <HeaderBox>
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

  // 빈 데이터 처리 (isEmpty() 메서드 대신 length 체크)
  if (!headerInfo || headerInfo.length === 0) {
    return (
      <SafeAreaView>
        <EmptyView />
      </SafeAreaView>
    );
  }

  return (
    <HeaderBox>
      <Carousel
        ref={ref}
        width={width}
        height={calculatedHeight}
        data={headerInfo}
        onProgressChange={onProgressChange}
        onSnapToItem={onSnapToItem}
        autoPlay={true}
        autoPlayInterval={1300}
        onConfigurePanGesture={(panGesture) => {
          panGesture.activeOffsetX([-10, 10]).failOffsetY([-5, 5]);
        }}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleContentPress(item)}>
            {item.backdropImgUrl ? (
              <BackdropImage
                key={`${item.id}-${item.type}`}
                style={{ height: calculatedHeight }}
                source={{
                  uri: formatter.prefixTmdbImgUrl(item.backdropImgUrl),
                }}
              />
            ) : (
              <View style={{ height: calculatedHeight, backgroundColor: colors.gray05 }} />
            )}
          </Pressable>
        )}
      />

      {/* 하단 그라데이션 */}
      <DarkedLinearShadow align={LinearAlign.bottomTop} height={178} />

      {/* 콘텐츠 정보 */}
      <FixedInfoView>
        <AnimatedInfoContainer style={{ opacity: infoOpacity }}>
          <PointDescription numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {currentItem?.pointDescription}
          </PointDescription>
          <Title numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {currentItem?.title}
          </Title>
          <CategoryListView>{renderKeywords()}</CategoryListView>
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

/* Variables */
const { width } = Dimensions.get('window');
const backdropRatio = 375 / 500;
const calculatedHeight = width / backdropRatio; // HeaderBox와 동일한 높이 계산

/* Styles */
const HeaderBox = styled.View({
  aspectRatio: backdropRatio,
  alignSelf: 'stretch',
  width: '100%',
});

const BackdropImage = styled.Image({
  width: '100%',
  resizeMode: 'cover', // 이미지 비율 유지하면서 컨테이너에 맞춤
});

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
