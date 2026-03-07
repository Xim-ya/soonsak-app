/**
 * WatchHistorySectionView - 시청기록 섹션 뷰 (공통 모듈)
 *
 * HomePage, MyPage 등에서 재사용 가능한 시청기록 가로 스크롤 섹션입니다.
 *
 * Toss Frontend Fundamentals:
 * - 응집도: 데이터 fetching과 UI가 함께 위치
 * - 단일 책임: 시청기록 프리뷰 표시만 담당
 * - 추상화: 내부 구현 숨기고 필요한 콜백만 노출
 *
 * 조건부 렌더링:
 * - 비로그인 유저: null 반환 (숨김)
 * - 데이터 없음: null 반환 (숨김)
 * - 로딩 중: 스켈레톤 표시
 *
 * @example
 * // HomePage에서 사용
 * <WatchHistorySectionView
 *   onItemPress={handleItemPress}
 *   onViewAllPress={handleViewAllPress}
 * />
 */

import { memo, useCallback, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { ShimmerSkeleton } from '@/presentation/components/image';
import { formatter, TmdbImageSize } from '@/core/utils/formatter';
import {
  useWatchHistoryPreview,
  WatchHistoryModel,
  type WatchHistoryModelType,
} from '@/features/watch-history';
import { WatchProgressBar, shouldShowProgressBar } from '@/presentation/components/progress';
import DarkChip from '@/presentation/components/chip/DarkChip';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

/* Types */

interface WatchHistorySectionViewProps {
  /** 아이템 클릭 핸들러 */
  readonly onItemPress?: (item: WatchHistoryModelType) => void;
  /** 전체보기 클릭 핸들러 */
  readonly onViewAllPress?: () => void;
  /** 섹션 제목 (기본값: "시청기록") */
  readonly title?: string;
  /** 페이지 사이즈 (기본값: 6) */
  readonly pageSize?: number;
}

interface WatchHistoryItemProps {
  readonly item: WatchHistoryModelType;
  readonly onItemPress: ((item: WatchHistoryModelType) => void) | undefined;
}

/* Constants */

const ITEM_WIDTH = AppSize.ratioWidth(160);
const ITEM_HEIGHT = ITEM_WIDTH * (9 / 16);
const ITEM_GAP = AppSize.ratioWidth(8);
const HORIZONTAL_PADDING = AppSize.ratioWidth(16);
const PROGRESS_BAR_HEIGHT = 3;
const SKELETON_COUNT = 3;

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

WatchHistoryItemComponent.displayName = 'WatchHistoryItem';

/* Main Component */

function WatchHistorySectionViewComponent({
  onItemPress,
  onViewAllPress,
  title = '시청기록',
  pageSize = 6,
}: WatchHistorySectionViewProps) {
  // 응집도: 데이터 fetching 로직을 컴포넌트 내부에서 관리
  const { items, isLoading, isEmpty, isFetchingNextPage, hasNextPage, isGuest, fetchNextPage } =
    useWatchHistoryPreview({
      pageSize,
    });

  // 중복 호출 방지용 ref
  const isLoadingMore = useRef(false);

  // 스크롤 끝 도달 시 다음 페이지 로드 (가로 FlatList용 onScroll 체크)
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const paddingToRight = 50; // 오른쪽 여유 거리
      const isCloseToRight =
        layoutMeasurement.width + contentOffset.x >= contentSize.width - paddingToRight;

      if (isCloseToRight && hasNextPage && !isFetchingNextPage && !isLoadingMore.current) {
        isLoadingMore.current = true;
        fetchNextPage().finally(() => {
          isLoadingMore.current = false;
        });
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const renderItem: ListRenderItem<WatchHistoryModelType> = useCallback(
    ({ item }) => <WatchHistoryItemComponent item={item} onItemPress={onItemPress} />,
    [onItemPress],
  );

  const keyExtractor = useCallback(
    (item: WatchHistoryModelType) => `${item.id}-${item.contentId}`,
    [],
  );

  // 아이템 레이아웃 계산 (스크롤 성능 최적화)
  const getItemLayout = useCallback(
    (_: ArrayLike<WatchHistoryModelType> | null | undefined, index: number) => ({
      length: ITEM_WIDTH + ITEM_GAP,
      offset: (ITEM_WIDTH + ITEM_GAP) * index,
      index,
    }),
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

  // 조건부 렌더링: 비로그인 유저는 숨김
  if (isGuest) {
    return null;
  }

  // 초기 로딩 중: 스켈레톤 표시
  if (isLoading) {
    return (
      <Container>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
        </SectionHeader>
        <SkeletonContainer>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonItemWrapper key={index}>
              <ShimmerSkeleton width={ITEM_WIDTH} height={ITEM_HEIGHT} borderRadius={4} />
              <SkeletonTitleBar />
            </SkeletonItemWrapper>
          ))}
        </SkeletonContainer>
      </Container>
    );
  }

  // 조건부 렌더링: 데이터 없으면 숨김 (레이아웃에 영향 없음)
  if (isEmpty) {
    return null;
  }

  return (
    <Container>
      <Pressable
        onPress={onViewAllPress}
        disabled={!onViewAllPress}
        accessibilityRole="button"
        accessibilityLabel={`${title} 전체보기`}
        accessibilityState={{ disabled: !onViewAllPress }}
      >
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          {onViewAllPress && <RightArrowIcon width={20} height={20} color={colors.white} />}
        </SectionHeader>
      </Pressable>
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={LIST_CONTENT_STYLE}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={renderListFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={6}
      />
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  marginTop: 32,
});

const SectionHeader = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: HORIZONTAL_PADDING,
  marginBottom: AppSize.ratioHeight(12),
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
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

/* Skeleton Components */

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

export const WatchHistorySectionView = memo(WatchHistorySectionViewComponent);
