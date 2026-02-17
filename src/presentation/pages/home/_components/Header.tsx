import { View, Text, Dimensions } from 'react-native';
import styled from '@emotion/native';
import { formatter } from '@/shared/utils/formatter';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import React from 'react';
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
import { useTopBannerConetns } from '../_hooks/useTopBannerContents';
import { style } from '@vanilla-extract/css';
import { SafeAreaFrameContext, SafeAreaView } from 'react-native-safe-area-context';

/**
 * 최신/대표 콘텐츠 들이 스와이프 형태로 노출 되는 뷰
 * */
export function Header() {
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
  } = useTopBannerConetns();

  // TODO: 예외처리뷰 추가 필요
  if (isError) {
    return <Text style={{ color: colors.white }}>Error!</Text>;
  }

  if (headerInfo.isEmpty()) {
    return (
      <SafeAreaView>
        <EmptyView />
      </SafeAreaView>
    );
  }

  return (
    <HeaderBox>
      {isLoading && <Text style={{ color: colors.white }}>Need to show Loading View</Text>}
      {
        <>
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
              <BackdropImage
                key={item.id}
                style={{ height: calculatedHeight }}
                source={{
                  uri: formatter.prefixTmdbImgUrl(item.backdropImgUrl),
                }}
              />
            )}
          />

          {/* 하단 그라데이션 */}
          <DarkedLinearShadow align={LinearAlign.bottomTop} height={178} />

          {/* 콘텐츠 정보 */}
          <FixedInfoView>
            <AnimatedInfoContainer style={{ opacity: infoOpacity }}>
              <PointDescription>{currentItem?.pointDescription}</PointDescription>
              <Title>{currentItem?.title}</Title>
              <CategoryListView>
                {currentItem?.keywords.map((keyword, index) => (
                  <CategoryItem key={keyword}>
                    {keyword}
                    {index + 1 !== currentItem.keywords.length && ' · '}
                  </CategoryItem>
                ))}
              </CategoryListView>
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
        </>
      }
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
  pointerEvents: 'none',
});

const AnimatedInfoContainer = Animated.createAnimatedComponent(
  styled.View({
    alignItems: 'center',
  }),
);

const PointDescription = styled.Text({
  color: colors.green,
  ...textStyle.body1,
  marginBottom: 1,
});

const Title = styled.Text({
  color: colors.white,
  ...textStyle.highlight,
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
