/**
 * AdminUserManagementScreen - 어드민 유저 관리 페이지
 *
 * 유저 통계 + 필터 탭 + 검색 + 정렬 + 무한스크롤 목록
 * 아이템 탭 시 AdminUserDetailPage로 이동
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
import type { UserManagementModel } from './_types';
import {
  UserStatisticsCards,
  UserSearchBar,
  UserSortSelector,
  UserManagementItem,
} from './_components';
import { useUserManagement } from './_hooks/useUserManagement';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// FlatList 최적화 상수
const ITEM_HEIGHT = 86; // UserManagementItem의 예상 높이 (아바타 50 + padding 24 + 여백)

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

export default function AdminUserManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    users,
    statistics,
    searchQuery,
    searchField,
    onSearchChange,
    onSearchFieldChange,
    onSearch,
    sortBy,
    onSortChange,
    showTodaySignupsOnly,
    onTodaySignupPress,
    isLoading,
    isStatisticsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
  } = useUserManagement();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 유저 아이템 탭 → AdminUserDetailPage로 이동
  const handleUserPress = useCallback(
    (user: UserManagementModel) => {
      navigation.navigate(routePages.adminUserDetail, {
        userId: user.id,
        displayName: user.displayName,
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
    ({ item }: { item: UserManagementModel }) => (
      <UserManagementItem user={item} onPress={handleUserPress} />
    ),
    [handleUserPress],
  );

  const keyExtractor = useCallback((item: UserManagementModel) => item.id, []);

  // FlatList 최적화: 아이템 레이아웃 (고정 높이)
  const getItemLayout = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderHeader = useCallback(
    () => (
      <>
        {/* 통계 카드 */}
        <UserStatisticsCards
          statistics={statistics}
          isLoading={isStatisticsLoading}
          showTodaySignupsOnly={showTodaySignupsOnly}
          onTodaySignupPress={onTodaySignupPress}
        />

        {/* 검색바 */}
        <UserSearchBar
          searchQuery={searchQuery}
          searchField={searchField}
          onSearchChange={onSearchChange}
          onSearchFieldChange={onSearchFieldChange}
          onSearch={onSearch}
        />

        {/* 정렬 선택 */}
        <UserSortSelector sortBy={sortBy} onSortChange={onSortChange} />
      </>
    ),
    [
      statistics,
      isStatisticsLoading,
      showTodaySignupsOnly,
      onTodaySignupPress,
      searchQuery,
      searchField,
      onSearchChange,
      onSearchFieldChange,
      onSearch,
      sortBy,
      onSortChange,
    ],
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
        <EmptyText>{showTodaySignupsOnly ? '오늘 가입한 유저가 없어요' : '유저가 없어요'}</EmptyText>
      </EmptyContainer>
    );
  }, [isLoading, showTodaySignupsOnly]);

  return (
    <BasePage useSafeArea={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle>유저 관리</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 유저 목록 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          ListHeaderComponent={renderHeader}
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
