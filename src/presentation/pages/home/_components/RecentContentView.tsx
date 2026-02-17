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

  const handleContentTapped = (content: BaseContentModel) => {
    navigation.navigate(routePages.contentDetail, {
      id: content.id,
      title: content.title,
      type: content.type,
    });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isError) {
    return <Text>최신 콘텐츠를 불러올 수 없습니다</Text>;
  }

  const handleTitlePress = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)(TabRoutes.Explore, { initialTab: 'latest' });
  };

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
