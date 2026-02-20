import { useCallback } from 'react';
import { FlatList, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import { useSearchContext } from '../_provider/SearchProvider';
import { SearchResultModel } from '../_types/searchResultModel';
import { SearchResultItem } from './SearchResultItem';
import { SearchEmptyState } from './SearchEmptyState';
import { TrendingContentGridView } from './TrendingContentGridView';

/**
 * 아이템 키 추출 함수 (FlatList 최적화)
 */
const keyExtractor = (item: SearchResultModel): string => `${item.contentType}-${item.id}`;

/**
 * SearchResultList - 검색 결과 리스트 컴포넌트
 *
 * 상태에 따라 다른 UI를 표시:
 * - 초기 상태: 트렌딩 콘텐츠 그리드
 * - 로딩 중: 로딩 인디케이터
 * - 에러/결과 없음: 빈 상태 컴포넌트
 * - 결과 있음: 검색 결과 리스트
 */
function SearchResultList() {
  const { results, isLoading, isEmpty, error, debouncedSearchText } = useSearchContext();

  const renderItem = useCallback(
    ({ item }: { item: SearchResultModel }) => <SearchResultItem item={item} />,
    [],
  );

  // 상태 플래그: 일관된 긍정형 네이밍으로 가독성 향상
  const hasSearchQuery = Boolean(debouncedSearchText.trim());
  const hasError = Boolean(error);
  const hasResults = !isEmpty;

  // 1. 검색어가 없는 초기 상태 -> 트렌딩 콘텐츠 표시
  if (!hasSearchQuery) {
    return (
      <InitialStateContainer>
        <TrendingContentGridView />
      </InitialStateContainer>
    );
  }

  // 2. 로딩 중
  if (isLoading) {
    return (
      <LoadingContainer>
        <ActivityIndicator color={colors.gray02} />
      </LoadingContainer>
    );
  }

  // 3. 에러 발생
  if (hasError) {
    return <SearchEmptyState type="error" />;
  }

  // 4. 결과 없음
  if (!hasResults) {
    return <SearchEmptyState type="noResults" />;
  }

  // 5. 결과 있음 -> 리스트 표시
  return (
    <StyledFlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  );
}

/* Styled Components */
const StyledFlatList = styled(FlatList<SearchResultModel>)({
  flex: 1,
  backgroundColor: colors.black,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.black,
});

const InitialStateContainer = styled(ScrollView)({
  flex: 1,
  backgroundColor: colors.black,
});

export { SearchResultList };
