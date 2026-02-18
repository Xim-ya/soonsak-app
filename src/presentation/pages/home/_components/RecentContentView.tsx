import { useCallback } from 'react';
import { Text } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { SectionContentListView } from './SectionContentListView';
import { RootStackParamList, TabParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
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
    (content: BaseContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
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
    navigation.navigate(TabRoutes.Explore, { initialTab: 'latest' });
  }, [navigation]);

  if (isError) {
    return <Text>최신 콘텐츠를 불러올 수 없습니다</Text>;
  }

  return (
    <SectionContentListView
      title="최신 콘텐츠"
      contents={isLoading ? [] : contents}
      onContentTapped={handleContentTapped}
      onEndReached={handleEndReached}
      isFetchingNextPage={isFetchingNextPage}
      onTitlePress={handleTitlePress}
    />
  );
}

export default RecentContentView;
