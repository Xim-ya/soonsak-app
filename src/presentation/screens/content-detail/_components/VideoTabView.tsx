import { Tabs } from 'react-native-collapsible-tab-view';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { AppSize } from '@/shared/utils/appSize';
import { useTabScrollListener } from '../_hooks/useTabScrollListener';
import { VideoMetricsView } from './VideoMetricsView';
import { SummaryView } from './SummaryView';
import CaseView from './CaseView';
import { MediaSectionView } from './MediaSectionView';
import { OtherChannelVideoListView } from './OtherChannelVideoListView';
import { ChannelInfoView } from './ChannelInfoView';
import { FeaturedCommentView } from './FeaturedCommentView';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { analyticsService } from '@/shared/analytics';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { useContentVideos } from '../_provider/ContentDetailProvider';

/** 태블릿 콘텐츠 레이아웃 상수 */
const TABLET_CONTENT_MAX_WIDTH = 800;
const TABLET_CONTENT_STYLE = {
  maxWidth: TABLET_CONTENT_MAX_WIDTH,
  width: '100%' as const,
  alignSelf: 'center' as const,
};

interface ScrollRef {
  scrollTo: (options: { y: number; animated: boolean }) => void;
}

// 메모이제이션된 탭 컴포넌트
function VideoTabView({ appBarOpacity }: { appBarOpacity: SharedValue<number> }) {
  useTabScrollListener(appBarOpacity);
  const { registerScrollRef } = useContentVideos();

  // Tabs.ScrollView ref
  const scrollViewRef = useRef<ScrollRef | null>(null);

  // 콘텐츠 정보 가져오기 (GA 로깅용)
  const { id: contentId } = useContentDetailRoute();
  const { commentTotalCountText } = useContentVideos();

  // 태블릿 레이아웃 스타일
  const isLargeScreen = AppSize.isLargeScreen();
  const tabletContentStyle = isLargeScreen ? TABLET_CONTENT_STYLE : undefined;

  // 댓글 바텀시트 상태
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  // 바텀시트 열기/닫기 핸들러
  const handleShowComments = useCallback(() => {
    // GA4 content_detail_comment_open 이벤트 로깅
    // commentTotalCountText 예: "1.2만개" -> 숫자 추출
    const commentCountMatch = commentTotalCountText?.match(/[\d,.]+/);
    const commentCountStr = commentCountMatch?.[0]?.replace(/,/g, '') ?? '0';
    // 만개 단위 처리
    let commentCount = parseFloat(commentCountStr);
    if (commentTotalCountText?.includes('만')) {
      commentCount = Math.floor(commentCount * 10000);
    } else if (commentTotalCountText?.includes('천')) {
      commentCount = Math.floor(commentCount * 1000);
    }

    analyticsService.contentDetailCommentOpen({
      content_id: Number(contentId),
      comment_count: commentCount || 0,
    });

    setIsCommentsVisible(true);
  }, [contentId, commentTotalCountText]);

  const handleCloseComments = useCallback(() => {
    setIsCommentsVisible(false);
  }, []);

  // 스크롤 ref 등록
  useEffect(() => {
    registerScrollRef({
      scrollToTop: () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      },
    });

    return () => {
      registerScrollRef(null);
    };
  }, [registerScrollRef]);

  return (
    <>
      <Tabs.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={isLargeScreen ? styles.tabletScrollContent : styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={tabletContentStyle}>
          {/* YouTube 메트릭 정보 */}
          <VideoMetricsView />

          {/* 채널 정보 */}
          <ChannelInfoView />

          {/* 다른 채널 영상 리스트 */}
          <OtherChannelVideoListView />

          {/* 대표 감상평 섹션 */}
          <FeaturedCommentView onPressShowAll={handleShowComments} />

          {/* 줄거리 */}
          <SummaryView />

          {/* 출연진 */}
          <CaseView />

          {/* 미디어 (스틸컷) */}
          <MediaSectionView />
        </View>
      </Tabs.ScrollView>

      {/* 전체 댓글 바텀시트 */}
      <CommentsBottomSheet visible={isCommentsVisible} onClose={handleCloseComments} />
    </>
  );
}

const MemoizedVideoTabView = React.memo(VideoTabView);
MemoizedVideoTabView.displayName = 'VideoTabView';

/** 스크롤뷰 스타일 */
const SCROLL_BOTTOM_PADDING = 120;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: SCROLL_BOTTOM_PADDING,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingBottom: SCROLL_BOTTOM_PADDING,
  },
  scrollView: {
    flex: 1,
  },
});

export { MemoizedVideoTabView as ContentTabView };
