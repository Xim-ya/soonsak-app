/**
 * ChannelAllPage - 전체 채널 목록 페이지
 *
 * 활성화된 전체 채널을 3열 그리드로 표시합니다.
 * 채널 로고(원형), 이름, 구독자 수를 보여주며 클릭 시 채널 상세 페이지로 이동합니다.
 * 무한 스크롤로 페이지네이션을 지원합니다 (페이지당 20개).
 *
 * @example
 * navigation.navigate(routePages.channelAll);
 */

import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import textStyles from '@/shared/styles/textStyles';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { formatter } from '@/shared/utils/formatter';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import { useChannelAll, type ChannelItemModel } from './_hooks/useChannelAll';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 3열 그리드 설정 (Flutter 스펙 기반) */
const COLUMN_COUNT = 3;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = AppSize.ratioWidth(31);
const GRID_ROW_GAP = AppSize.ratioWidth(28);
/** 태블릿 최대 컨테이너 너비 */
const TABLET_MAX_WIDTH = 500;
const FOOTER_HEIGHT = 60;

/** 그리드 너비 계산 (태블릿은 maxWidth 제한) */
function getGridWidth(isLargeScreen: boolean): number {
  if (isLargeScreen) {
    return Math.min(AppSize.actualScreenWidth, TABLET_MAX_WIDTH);
  }
  return AppSize.screenWidth;
}

/** 아이템 너비 계산 */
function getItemWidth(gridWidth: number): number {
  return (
    (gridWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT
  );
}

export default function ChannelAllPage(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const isLargeScreen = AppSize.isLargeScreen();

  // 반응형 레이아웃 계산
  const gridWidth = getGridWidth(isLargeScreen);
  const itemWidth = getItemWidth(gridWidth);
  const avatarSize = itemWidth - 16;

  const { channels, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChannelAll();

  // 채널 클릭 -> 채널 상세 페이지
  const handleChannelPress = useCallback(
    (channel: ChannelItemModel) => {
      const params: RootStackParamList[typeof routePages.channelDetail] = {
        channelId: channel.id,
      };
      if (channel.name) params.channelName = channel.name;
      if (channel.logoUrl) params.channelLogoUrl = channel.logoUrl;
      if (channel.subscriberCount) params.subscriberCount = channel.subscriberCount;

      navigation.navigate(routePages.channelDetail, params);
    },
    [navigation],
  );

  // 무한 스크롤
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 채널 아이템 렌더링
  const renderChannelItem = useCallback(
    ({ item }: ListRenderItemInfo<ChannelItemModel>) => {
      const subscriberText = item.subscriberCount
        ? `${formatter.formatNumberWithUnit(item.subscriberCount)}명`
        : '';

      return (
        <ChannelItemContainer
          style={{ width: itemWidth }}
          onPress={() => handleChannelPress(item)}
          activeOpacity={0.7}
        >
          <RoundedAvatorView source={item.logoUrl} size={avatarSize} />
          <ChannelName numberOfLines={1}>{item.name}</ChannelName>
          {subscriberText !== '' && <SubscriberText>{subscriberText}</SubscriberText>}
        </ChannelItemContainer>
      );
    },
    [handleChannelPress, itemWidth, avatarSize],
  );

  const keyExtractor = useCallback((item: ChannelItemModel) => item.id, []);

  // 빈 상태 (로딩 제외)
  const renderListEmpty = useCallback(() => {
    if (isLoading) return null; // 초기 로딩은 별도 처리
    if (error) {
      return (
        <EmptyContainer>
          <EmptyText>채널을 불러올 수 없습니다</EmptyText>
        </EmptyContainer>
      );
    }
    return (
      <EmptyContainer>
        <EmptyText>채널이 없습니다</EmptyText>
      </EmptyContainer>
    );
  }, [isLoading, error]);

  // 하단 로딩
  const renderListFooter = useCallback(() => {
    return (
      <FooterContainer>
        {isFetchingNextPage && <ActivityIndicator color={colors.gray02} />}
      </FooterContainer>
    );
  }, [isFetchingNextPage]);

  // 태블릿 중앙 정렬 스타일
  const contentContainerStyle = {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: AppSize.bottomInset + 20,
    ...(isLargeScreen && {
      alignSelf: 'center' as const,
      width: gridWidth,
    }),
  };

  const columnWrapperStyle = {
    gap: GRID_COLUMN_GAP,
    marginBottom: GRID_ROW_GAP,
  };

  // 초기 로딩
  if (isLoading) {
    return (
      <BasePage useSafeArea>
        <BackButtonAppBar title="전체 채널" />
        <LoadingContainer>
          <ActivityIndicator color={colors.gray02} size="large" />
        </LoadingContainer>
      </BasePage>
    );
  }

  return (
    <BasePage useSafeArea>
      <BackButtonAppBar title="전체 채널" />
      <FlatList
        data={channels}
        keyExtractor={keyExtractor}
        renderItem={renderChannelItem}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={contentContainerStyle}
        columnWrapperStyle={columnWrapperStyle}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
      />
    </BasePage>
  );
}

/* Styled Components */

const ChannelItemContainer = styled.TouchableOpacity({
  alignItems: 'center',
});

const ChannelName = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  marginTop: 8,
  textAlign: 'center',
});

const SubscriberText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 2,
});

const EmptyContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const FooterContainer = styled.View({
  height: FOOTER_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});
