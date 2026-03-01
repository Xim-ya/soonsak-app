/**
 * AdminChannelManagementScreen - 어드민 채널 관리 페이지
 *
 * 채널 목록 무한스크롤 + 아이템 탭 시 채널 상세 페이지로 이동
 */

import { useCallback } from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { BasePage } from '@/presentation/components/page';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import type { ChannelManagementItem as ChannelManagementItemType } from '@/features/admin';
import { ChannelManagementItem } from './_components';
import { useChannelManagement } from './_hooks/useChannelManagement';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// FlatList 최적화 상수
const ITEM_HEIGHT = 74; // ChannelManagementItem의 예상 높이 (로고 50 + padding 24)

// 뒤로가기 아이콘 SVG (컴포넌트 외부 상수로 최적화)
const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// FlatList contentContainerStyle 상수 (매 렌더마다 객체 재생성 방지)
const getContentContainerStyle = (bottomInset: number) => ({
  paddingBottom: bottomInset + 20,
  flexGrow: 1,
});

export default function AdminChannelManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    channels,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
  } = useChannelManagement();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 채널 아이템 탭 -> AdminChannelDetailPage로 이동
  const handleChannelPress = useCallback(
    (channel: ChannelManagementItemType) => {
      navigation.navigate(routePages.adminChannelDetail, {
        channelId: channel.id,
        channelName: channel.name,
      });
    },
    [navigation],
  );

  // 무한스크롤 트리거
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ChannelManagementItemType }) => (
      <ChannelManagementItem channel={item} onPress={handleChannelPress} />
    ),
    [handleChannelPress],
  );

  const keyExtractor = useCallback((item: ChannelManagementItemType) => item.id, []);

  // FlatList 최적화: 아이템 레이아웃 (고정 높이)
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterLoadingContainer>
        <ActivityIndicator size="small" color={colors.gray02} />
      </FooterLoadingContainer>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <EmptyContainer>
        <EmptyText>등록된 채널이 없습니다</EmptyText>
      </EmptyContainer>
    );
  }, [isLoading]);

  return (
    <BasePage useSafeArea={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle>채널 관리</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 채널 목록 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : (
        <FlatList
          data={channels}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={getContentContainerStyle(insets.bottom)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.gray02}
            />
          }
          ItemSeparatorComponent={Separator}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
        />
      )}
    </BasePage>
  );
}

/* Styled Components */
const HeaderContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: paddingTop + 8,
  paddingBottom: 12,
  paddingHorizontal: 16,
  backgroundColor: colors.black,
}));

const BackButton = styled(TouchableOpacity)({
  padding: 4,
});

const HeaderTitle = styled.Text({
  flex: 1,
  ...textStyles.title1,
  color: colors.white,
  textAlign: 'center',
});

const HeaderSpacer = styled.View({
  width: 32,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const FooterLoadingContainer = styled.View({
  paddingVertical: 20,
  alignItems: 'center',
});

const EmptyContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 100,
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});

const Separator = styled.View({
  height: 1,
  backgroundColor: colors.gray05,
  marginHorizontal: 16,
});
