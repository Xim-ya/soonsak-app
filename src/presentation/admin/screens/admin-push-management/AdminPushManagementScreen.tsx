/**
 * AdminPushManagementScreen - 어드민 푸시 관리 페이지
 *
 * 푸시 알림 발송 내역 및 템플릿 관리
 * - 탭: [발송 내역 | 템플릿]
 * - 발송 내역: 유저, 푸시 내용, 타입, 읽음 여부
 * - 유저 이름 검색
 * - 통계 카드
 */

import { useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { BasePage } from '@/presentation/components/page';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { PushTemplateModel, PushReceiptModel } from './_types';
import {
  PushStatisticsCards,
  PushTemplateItem,
  PushReceiptListItem,
  BroadcastPushSender,
} from './_components';
import { usePushManagement } from './_hooks';

// 뒤로가기 아이콘 SVG
const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 검색 아이콘 SVG
const SEARCH_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 19L14.65 14.65" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// FlatList contentContainerStyle
const getContentContainerStyle = (bottomInset: number) => ({
  paddingBottom: bottomInset + 20,
  flexGrow: 1,
});

export default function AdminPushManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    // Tab
    activeTab,
    handleTabChange,
    // Search
    searchQuery,
    handleSearchChange,
    handleSearch,
    // Templates
    templates,
    isTemplatesLoading,
    // Receipts
    receipts,
    isReceiptsLoading,
    isFetchingNextPage,
    handleLoadMore,
    // Statistics
    statistics,
    isStatisticsLoading,
    // Actions
    isRefreshing,
    handleRefresh,
    handleCancelSchedule,
    handleDeleteTemplate,
    handleToggleActive,
    // Broadcast
    isSendingBroadcast,
    handleSendBroadcast,
    activePushTokens,
  } = usePushManagement();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSearchSubmit = useCallback(() => {
    Keyboard.dismiss();
    handleSearch();
  }, [handleSearch]);

  // 발송 내역 아이템 렌더링
  const renderReceiptItem = useCallback(
    ({ item }: { item: PushReceiptModel }) => <PushReceiptListItem receipt={item} />,
    [],
  );

  // 템플릿 아이템 렌더링
  const renderTemplateItem = useCallback(
    ({ item }: { item: PushTemplateModel }) => (
      <PushTemplateItem
        template={item}
        onToggleActive={handleToggleActive}
        onCancelSchedule={handleCancelSchedule}
        onDelete={handleDeleteTemplate}
      />
    ),
    [handleToggleActive, handleCancelSchedule, handleDeleteTemplate],
  );

  const receiptKeyExtractor = useCallback((item: PushReceiptModel) => item.id, []);
  const templateKeyExtractor = useCallback((item: PushTemplateModel) => item.id, []);

  // 헤더 렌더링
  const renderHeader = useCallback(
    () => (
      <>
        {/* 통계 카드 */}
        <PushStatisticsCards statistics={statistics} isLoading={isStatisticsLoading} />

        {/* 전체 푸시 발송 */}
        <BroadcastPushSender
          activePushTokens={activePushTokens}
          isLoading={isSendingBroadcast}
          onSend={handleSendBroadcast}
        />

        {/* 탭 바 */}
        <TabBar>
          <TabButton active={activeTab === 'receipts'} onPress={() => handleTabChange('receipts')}>
            <TabText active={activeTab === 'receipts'}>발송 내역</TabText>
          </TabButton>
          <TabButton
            active={activeTab === 'templates'}
            onPress={() => handleTabChange('templates')}
          >
            <TabText active={activeTab === 'templates'}>템플릿</TabText>
          </TabButton>
        </TabBar>

        {/* 검색바 (발송 내역 탭에서만) */}
        {activeTab === 'receipts' && (
          <SearchContainer>
            <SearchInputWrapper>
              <SvgXml xml={SEARCH_ICON_SVG} width={20} height={20} />
              <SearchInput
                placeholder="유저 이름 또는 이메일 검색"
                placeholderTextColor={colors.gray03}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
            </SearchInputWrapper>
          </SearchContainer>
        )}

        <SectionTitle>{activeTab === 'receipts' ? '발송 내역' : '템플릿 목록'}</SectionTitle>
      </>
    ),
    [
      statistics,
      isStatisticsLoading,
      activePushTokens,
      isSendingBroadcast,
      handleSendBroadcast,
      activeTab,
      handleTabChange,
      searchQuery,
      handleSearchChange,
      handleSearchSubmit,
    ],
  );

  // 푸터 렌더링 (로딩)
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterLoadingContainer>
        <ActivityIndicator size="small" color={colors.gray02} />
      </FooterLoadingContainer>
    );
  }, [isFetchingNextPage]);

  // Empty 렌더링
  const renderEmpty = useCallback(() => {
    const isLoading = activeTab === 'receipts' ? isReceiptsLoading : isTemplatesLoading;
    if (isLoading) return null;
    return (
      <EmptyContainer>
        <EmptyText>
          {activeTab === 'receipts'
            ? searchQuery
              ? '검색 결과가 없어요'
              : '발송 내역이 없어요'
            : '등록된 템플릿이 없어요'}
        </EmptyText>
      </EmptyContainer>
    );
  }, [activeTab, isReceiptsLoading, isTemplatesLoading, searchQuery]);

  const isLoading = activeTab === 'receipts' ? isReceiptsLoading : isTemplatesLoading;

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle>푸시 관리</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 리스트 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : activeTab === 'receipts' ? (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={receiptKeyExtractor}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={getContentContainerStyle(insets.bottom)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gray02}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplateItem}
          keyExtractor={templateKeyExtractor}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={getContentContainerStyle(insets.bottom)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gray02}
            />
          }
          showsVerticalScrollIndicator={false}
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

const TabBar = styled.View({
  flexDirection: 'row',
  marginHorizontal: 16,
  marginTop: 8,
  backgroundColor: colors.gray05,
  borderRadius: 8,
  padding: 4,
});

const TabButton = styled(TouchableOpacity)<{ active: boolean }>(({ active }) => ({
  flex: 1,
  paddingVertical: 10,
  borderRadius: 6,
  backgroundColor: active ? colors.gray04 : 'transparent',
  alignItems: 'center',
}));

const TabText = styled.Text<{ active: boolean }>(({ active }) => ({
  ...textStyles.body2,
  color: active ? colors.white : colors.gray03,
  fontWeight: active ? '600' : '400',
}));

const SearchContainer = styled.View({
  paddingHorizontal: 16,
  paddingTop: 12,
});

const SearchInputWrapper = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
});

const SearchInput = styled(TextInput)({
  flex: 1,
  marginLeft: 8,
  ...textStyles.body2,
  color: colors.white,
  padding: 0,
});

const SectionTitle = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
  fontWeight: '600',
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 12,
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
