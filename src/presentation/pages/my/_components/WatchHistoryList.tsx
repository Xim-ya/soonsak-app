/**
 * WatchHistoryList - 시청 기록 가로 스크롤 목록
 *
 * Toss Frontend Fundamentals 원칙 적용:
 * - 응집도: 데이터 fetching과 UI가 함께 위치
 * - 단일 책임: 시청 기록 프리뷰 표시만 담당
 * - 추상화: 내부 구현 숨기고 필요한 콜백만 노출
 *
 * 기능:
 * - 가로 무한 스크롤 (최대 12개)
 * - 6개씩 페이지네이션
 * - 스크롤 끝 도달 시 자동 로드
 */

import { memo, useCallback } from 'react';
import { FlatList, ListRenderItem, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { ShimmerSkeleton } from '@/presentation/components/image';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import {
  useWatchHistoryPreview,
  WatchHistoryModel,
  type WatchHistoryModelType,
} from '@/features/watch-history';
import {
  WatchProgressBar,
  shouldShowProgressBar,
} from '@/presentation/components/progress';
import DarkChip from '@/presentation/components/chip/DarkChip';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

/* Types */

interface WatchHistoryListProps {
  /** 아이템 클릭 핸들러 */
  readonly onItemPress?: (item: WatchHistoryModelType) => void;
  /** 전체보기 클릭 핸들러 */
  readonly onViewAllPress?: () => void;
}

interface WatchHistoryItemProps {
  readonly item: WatchHistoryModelType;
  readonly onItemPress: ((item: WatchHistoryModelType) => void) | undefined;
}

/* Constants */

const PAGE_SIZE = 6;
const MAX_ITEMS = 12;
const ITEM_WIDTH = AppSize.ratioWidth(160);
const ITEM_HEIGHT = ITEM_WIDTH * (9 / 16);
const ITEM_GAP = AppSize.ratioWidth(8);
const HORIZONTAL_PADDING = AppSize.ratioWidth(16);
const PROGRESS_BAR_HEIGHT = 3;

const LIST_CONTENT_STYLE = {
  paddingHorizontal: HORIZONTAL_PADDING,
};

/* Sub-Components */

const WatchHistoryItemComponent = memo(({ item, onItemPress }: WatchHistoryItemProps) => {
  // 공통 유틸리티로 이미지 URL 추출 (backdrop > poster)
  const imageUrl = WatchHistoryModel.getImageUrl(item, {
    backdropSize: TmdbImageSize.w342,
    posterSize: TmdbImageSize.w185,
  });

  const showProgressBar = shouldShowProgressBar(item.progressSeconds, item.durationSeconds);

  const handlePress = useCallback(() => {
    onItemPress?.(item);
  }, [onItemPress, item]);

  return (
    <ItemContainer>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <ImageWrapper>
          <LoadableImageView
            source={imageUrl}
            width={ITEM_WIDTH}
            height={ITEM_HEIGHT}
            borderRadius={4}
          />
          {item.durationSeconds > 0 && (
            <RuntimeChipContainer>
              <DarkChip content={formatter.formatRuntime(item.durationSeconds)} />
            </RuntimeChipContainer>
          )}
          {showProgressBar && (
            <ProgressBarWrapper>
              <WatchProgressBar
                progressSeconds={item.progressSeconds}
                durationSeconds={item.durationSeconds}
                height={PROGRESS_BAR_HEIGHT}
              />
            </ProgressBarWrapper>
          )}
        </ImageWrapper>
        <ItemTitle numberOfLines={1}>{item.contentTitle}</ItemTitle>
      </TouchableOpacity>
    </ItemContainer>
  );
});

/* Main Component */

function WatchHistoryListComponent({
  onItemPress,
  onViewAllPress,
}: WatchHistoryListProps) {
  // 응집도: 데이터 fetching 로직을 컴포넌트 내부에서 관리
  const {
    items,
    isLoading,
    isEmpty,
    isFetchingNextPage,
    hasNextPage,
    isGuest,
    fetchNextPage,
  } = useWatchHistoryPreview({
    pageSize: PAGE_SIZE,
    maxItems: MAX_ITEMS,
  });

  // 스크롤 끝 도달 시 다음 페이지 로드
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem: ListRenderItem<WatchHistoryModelType> = useCallback(
    ({ item }) => <WatchHistoryItemComponent item={item} onItemPress={onItemPress} />,
    [onItemPress],
  );

  const keyExtractor = useCallback(
    (item: WatchHistoryModelType) => `${item.id}-${item.contentId}`,
    [],
  );

  // 로딩 인디케이터 (우측 끝)
  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterLoadingContainer>
        <ActivityIndicator color={colors.gray02} size="small" />
      </FooterLoadingContainer>
    );
  }, [isFetchingNextPage]);

  // 초기 로딩 중: 스켈레톤 표시
  if (isLoading) {
    return (
      <Container>
        <SectionHeader>
          <SectionTitle>시청기록</SectionTitle>
        </SectionHeader>
        <SkeletonContainer>
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonItemWrapper key={index}>
              <ShimmerSkeleton width={ITEM_WIDTH} height={ITEM_HEIGHT} borderRadius={4} />
              <SkeletonTitleBar />
            </SkeletonItemWrapper>
          ))}
        </SkeletonContainer>
      </Container>
    );
  }

  // 비로그인 유저: 빈 상태 메시지
  if (isGuest) {
    return (
      <Container>
        <SectionHeader>
          <SectionTitle>시청기록</SectionTitle>
        </SectionHeader>
        <EmptyStateContainer>
          <EmptyStateText>로그인하면 시청기록이 저장돼요</EmptyStateText>
        </EmptyStateContainer>
      </Container>
    );
  }

  // 로그인 유저 + 기록 없음 (로딩 완료 후 에러 없이 데이터 없음)
  if (isEmpty) {
    return (
      <Container>
        <SectionHeader>
          <SectionTitle>시청기록</SectionTitle>
        </SectionHeader>
        <EmptyStateContainer>
          <EmptyStateText>아직 시청한 작품이 없어요</EmptyStateText>
        </EmptyStateContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Pressable
        onPress={onViewAllPress}
        disabled={!onViewAllPress}
        accessibilityRole="button"
        accessibilityLabel="시청기록 전체보기"
        accessibilityState={{ disabled: !onViewAllPress }}
      >
        <SectionHeader>
          <SectionTitle>시청기록</SectionTitle>
          {onViewAllPress && <RightArrowIcon width={20} height={20} color={colors.white} />}
        </SectionHeader>
      </Pressable>
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={LIST_CONTENT_STYLE}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={renderListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
      />
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  paddingVertical: AppSize.ratioHeight(16),
});

const SectionHeader = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: HORIZONTAL_PADDING,
  marginBottom: AppSize.ratioHeight(12),
});

const SectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const EmptyStateContainer = styled.View({
  height: ITEM_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: HORIZONTAL_PADDING,
});

const SkeletonContainer = styled.View({
  flexDirection: 'row',
  paddingHorizontal: HORIZONTAL_PADDING,
});

const SkeletonItemWrapper = styled.View({
  marginRight: ITEM_GAP,
});

const SkeletonTitleBar = styled.View({
  width: ITEM_WIDTH * 0.7,
  height: 12,
  backgroundColor: colors.gray05,
  borderRadius: 4,
  marginTop: AppSize.ratioHeight(6),
});

const EmptyStateText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const ItemSeparator = () => <SeparatorView />;

const SeparatorView = styled.View({
  width: ITEM_GAP,
});

const ItemContainer = styled.View({
  width: ITEM_WIDTH,
});

const ImageWrapper = styled.View({
  position: 'relative',
  width: ITEM_WIDTH,
  height: ITEM_HEIGHT,
  borderRadius: 4,
  overflow: 'hidden',
});

const RuntimeChipContainer = styled.View({
  position: 'absolute',
  bottom: 6,
  right: 6,
  zIndex: 1,
});

const ProgressBarWrapper = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
});

const ItemTitle = styled.Text({
  ...textStyles.desc,
  color: colors.white,
  marginTop: AppSize.ratioHeight(6),
});

const FooterLoadingContainer = styled.View({
  width: 40,
  height: ITEM_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
});

export const WatchHistoryList = memo(WatchHistoryListComponent);
