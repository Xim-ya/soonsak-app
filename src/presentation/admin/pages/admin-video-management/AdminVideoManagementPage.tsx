/**
 * AdminVideoManagementPage - 어드민 비디오 처리 페이지
 *
 * 비디오 상태별 필터링 + 무한스크롤 목록
 * 아이템 탭 시 ContentDetailPage로 이동
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
import type { VideoManagementModel } from './_types';
import { VideoFilterTabs, VideoManagementItem } from './_components';
import { useVideoManagement } from './_hooks/useVideoManagement';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 뒤로가기 아이콘 SVG
const backIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export default function AdminVideoManagementPage() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    videos,
    counts,
    selectedStatus,
    onSelectStatus,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
  } = useVideoManagement();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 비디오 아이템 탭 → ContentDetailPage로 이동
  const handleVideoPress = useCallback(
    (video: VideoManagementModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: video.contentId,
        type: video.contentType,
        title: video.contentTitle,
        videoId: video.id,
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
    ({ item }: { item: VideoManagementModel }) => (
      <VideoManagementItem video={item} onPress={handleVideoPress} />
    ),
    [handleVideoPress],
  );

  const keyExtractor = useCallback((item: VideoManagementModel) => item.id, []);

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
        <EmptyText>비디오가 없습니다</EmptyText>
      </EmptyContainer>
    );
  }, [isLoading]);

  return (
    <BasePage useSafeArea={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={backIconSvg} width={24} height={24} />
        </BackButton>
        <HeaderTitle>비디오 처리</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 필터 탭 */}
      <VideoFilterTabs
        counts={counts}
        selectedStatus={selectedStatus}
        onSelectStatus={onSelectStatus}
      />

      {/* 비디오 목록 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            flexGrow: 1,
          }}
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
