import React, { useCallback } from 'react';
import { ListRenderItemInfo, View } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import Gap from '@/presentation/components/view/Gap';
import {
  HorizontalCardSlider,
  CardSkeletonBox,
  CARD_SLIDER,
} from '@/presentation/components/slider/HorizontalCardSlider';
import { ContentCardImage } from '@/presentation/components/card/ContentCardImage';
import { useContentCollections } from '../_hooks/useContentCollections';
import {
  ContentCollectionModel,
  CollectionContentModel,
} from '../_types/contentCollectionModel.home';

interface ContentCollectionSectionViewProps {
  /** 화면에 노출되었는지 여부 (레이지 로드 트리거) */
  isVisible: boolean;
}

/**
 * 컬렉션 콘텐츠 아이템 컴포넌트
 */
const CollectionContentItem = React.memo(({ item }: { item: CollectionContentModel }) => (
  <ContentCardImage item={item} />
));
CollectionContentItem.displayName = 'CollectionContentItem';

/**
 * Skeleton 아이템 컴포넌트
 */
const SkeletonItem = React.memo(() => <CardSkeletonBox />);
SkeletonItem.displayName = 'CollectionSkeletonItem';

/**
 * 단일 컬렉션 섹션 컴포넌트
 */
const CollectionSection = React.memo(({ collection }: { collection: ContentCollectionModel }) => {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CollectionContentModel | null>) =>
      !item ? <SkeletonItem /> : <CollectionContentItem item={item} />,
    [],
  );

  if (collection.contents.length === 0) {
    return null;
  }

  return (
    <HorizontalCardSlider
      title={collection.title}
      data={collection.contents}
      isLoading={false}
      isError={false}
      keyPrefix={`collection-${collection.id}`}
      renderItem={renderItem}
    />
  );
});
CollectionSection.displayName = 'CollectionSection';

/**
 * 스켈레톤 컬렉션 섹션
 */
const CollectionSkeletonSection = React.memo(() => (
  <SkeletonSectionContainer>
    <TitleSkeleton />
    <Gap size={7} />
    <SkeletonListContainer>
      <CardSkeletonBox />
      <Gap size={CARD_SLIDER.SEPARATOR_WIDTH} />
      <CardSkeletonBox />
    </SkeletonListContainer>
  </SkeletonSectionContainer>
));
CollectionSkeletonSection.displayName = 'CollectionSkeletonSection';

/**
 * 콘텐츠 컬렉션 섹션 뷰
 * 여러 큐레이션 컬렉션을 순차적으로 표시
 * 레이지 로드: isVisible이 true가 되면 데이터 로드 시작
 */
function ContentCollectionSectionView({ isVisible }: ContentCollectionSectionViewProps) {
  const { data: collections, isLoading, isError } = useContentCollections(isVisible);

  if (!isVisible) {
    return null;
  }

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <View>
        <CollectionSkeletonSection />
        <CollectionSkeletonSection />
      </View>
    );
  }

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <View>
      {collections.map((collection) => (
        <CollectionSection key={collection.id} collection={collection} />
      ))}
    </View>
  );
}

/* Styled Components */

const SkeletonSectionContainer = styled.View({
  marginTop: 40,
  paddingHorizontal: 16,
});

const TitleSkeleton = styled.View({
  width: 180,
  height: 22,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

const SkeletonListContainer = styled.View({
  flexDirection: 'row',
});

export { ContentCollectionSectionView };
