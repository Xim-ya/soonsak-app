import { useCallback } from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { SectionContentListView } from './SectionContentListView';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { TabRoutes } from '@/shared/navigation/constant/tabConfigs';
import { useRecentContents } from '../_hooks/useRecentContents';

export function RecentContentView() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)(TabRoutes.Explore, { initialTab: 'latest' });
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
