/**
 * AdminChannelDetailScreen - 어드민 채널 상세 페이지
 *
 * 채널 정보, 연결된 콘텐츠 그리드, 삭제 기능을 제공합니다.
 */

import { useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { BasePage } from '@/presentation/components/page';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { routePages } from '@/presentation/navigation/constant/routePages';
import type { RootStackParamList, ScreenRouteProp } from '@/presentation/navigation/types';
import type { ChannelContentItem } from '@/features/admin/api/adminChannelApi';
import {
  ChannelInfoSection,
  MemoizedChannelContentGridItem,
  GRID_ITEM_HEIGHT,
} from './_components';
import { useChannelDetail } from './_hooks/useChannelDetail';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = ScreenRouteProp<typeof routePages.adminChannelDetail>;

// ============================================================================
// Constants
// ============================================================================

const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const DELETE_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 6H5H21" stroke="${colors.red}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="${colors.red}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/** 그리드 열 간격 스타일 */
const columnWrapperStyle = { gap: 9 };

// ============================================================================
// Component
// ============================================================================

export default function AdminChannelDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const insets = useSafeAreaInsets();

  const { channelId, channelName } = route.params;

  const {
    channelDetail,
    contents,
    isLoading,
    isContentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    deleteChannel,
    isDeleting,
    refetch,
  } = useChannelDetail(channelId);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 콘텐츠 아이템 클릭
  const handleContentPress = useCallback(
    (item: ChannelContentItem) => {
      navigation.push(routePages.contentDetail, {
        id: item.contentId,
        title: item.contentTitle,
        type: item.contentType,
      });
    },
    [navigation],
  );

  // 삭제 버튼 클릭
  const handleDeletePress = useCallback(() => {
    deleteChannel();
  }, [deleteChannel]);

  // 헤더 타이틀
  const headerTitle = useMemo(
    () => channelDetail?.name ?? channelName,
    [channelDetail?.name, channelName],
  );

  // 아이템 렌더링
  const renderItem = useCallback(
    ({ item }: { item: ChannelContentItem }) => (
      <MemoizedChannelContentGridItem item={item} onPress={handleContentPress} />
    ),
    [handleContentPress],
  );

  // 키 추출
  const keyExtractor = useCallback(
    (item: ChannelContentItem) => `${item.contentType}-${item.contentId}`,
    [],
  );

  // 아이템 레이아웃 (성능 최적화)
  const getItemLayout = useCallback(
    (_: ArrayLike<ChannelContentItem> | null | undefined, index: number) => {
      const rowIndex = Math.floor(index / 3);
      return {
        length: GRID_ITEM_HEIGHT,
        offset: GRID_ITEM_HEIGHT * rowIndex,
        index,
      };
    },
    [],
  );

  // 헤더 컴포넌트 (채널 정보 섹션)
  const ListHeaderComponent = useMemo(() => {
    if (!channelDetail) return null;
    return (
      <HeaderSection>
        <ChannelInfoSection channel={channelDetail} />
        <SectionTitle>연결된 콘텐츠</SectionTitle>
      </HeaderSection>
    );
  }, [channelDetail]);

  // 푸터 컴포넌트 (로딩 인디케이터)
  const ListFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterContainer>
        <ActivityIndicator size="small" color={colors.gray02} />
      </FooterContainer>
    );
  }, [isFetchingNextPage]);

  // 빈 상태 컴포넌트
  const ListEmptyComponent = useMemo(() => {
    if (isContentsLoading) return null;
    return (
      <EmptyContainer>
        <EmptyText>연결된 콘텐츠가 없어요</EmptyText>
      </EmptyContainer>
    );
  }, [isContentsLoading]);

  // 끝 도달 핸들러
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <BasePage useSafeArea={false}>
      {/* 헤더 */}
      <Header paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle numberOfLines={1}>{headerTitle}</HeaderTitle>
        <DeleteButton
          onPress={handleDeletePress}
          disabled={isDeleting || isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.red} />
          ) : (
            <SvgXml xml={DELETE_ICON_SVG} width={24} height={24} />
          )}
        </DeleteButton>
      </Header>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : (
        <FlatList
          data={contents}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 20,
          }}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          maxToRenderPerBatch={9}
          windowSize={5}
          initialNumToRender={15}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.gray02} />
          }
        />
      )}
    </BasePage>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Header = styled(View)<{ paddingTop: number }>(({ paddingTop }) => ({
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
  ...textStyles.title1,
  color: colors.white,
  flex: 1,
  textAlign: 'center',
  marginHorizontal: 8,
});

const DeleteButton = styled(TouchableOpacity)({
  padding: 4,
});

const LoadingContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const HeaderSection = styled(View)({
  marginBottom: 8,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginTop: 24,
  marginBottom: 12,
  marginHorizontal: 0,
});

const FooterContainer = styled(View)({
  paddingVertical: 16,
  alignItems: 'center',
});

const EmptyContainer = styled(View)({
  paddingVertical: 40,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});
