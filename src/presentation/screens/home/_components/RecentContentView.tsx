import { useCallback } from 'react';
import { Text } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BaseContentModel } from '@/shared/types/content/baseContentModel';
import { SectionContentListView } from './SectionContentListView';
import { RootStackParamList, TabParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/shared/analytics';
import { TabRoutes } from '@/shared/navigation/constant/tabConfigs';
import { useRecentContents } from '../_hooks/useRecentContents';

/** 홈 화면에서 사용하는 복합 네비게이션 타입 (스택 + 탭) */
type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function RecentContentView() {
  const navigation = useNavigation<HomeNavigationProp>();

  const { contents, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRecentContents();

  const handleContentTapped = useCallback(
    (content: BaseContentModel, position: number) => {
      // 섹션 콘텐츠 클릭 이벤트 로깅
      analyticsService.homeSectionClick({
        section_type: 'recent',
        content_id: content.id,
        content_type: content.type,
        position,
      });

      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
        source: ContentSource.HOME_RECENT,
      });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleTitlePress = useCallback(() => {
    // 더보기 클릭 이벤트 로깅
    analyticsService.homeSectionMoreClick({
      section_type: 'recent',
      destination: 'explore_latest',
    });

    navigation.navigate(TabRoutes.Explore, { initialTab: 'latest' });
  }, [navigation]);

  if (isError) {
    return <Text>콘텐츠를 불러올 수 없습니다</Text>;
  }

  return (
    <SectionContentListView
      title="새로 올라왔어요"
      contents={contents}
      isLoading={isLoading}
      onContentTapped={handleContentTapped}
      onEndReached={handleEndReached}
      isFetchingNextPage={isFetchingNextPage}
      onTitlePress={handleTitlePress}
    />
  );
}

export default RecentContentView;
