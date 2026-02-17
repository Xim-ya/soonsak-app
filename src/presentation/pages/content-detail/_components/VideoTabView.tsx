import { Tabs } from 'react-native-collapsible-tab-view';
import React, { useState, useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useTabScrollListener } from '../_hooks/useTabScrollListener';
import { VideoMetricsView } from './VideoMetricsView';
import { SummaryView } from './SummaryView';
import CaseView from './CaseView';
import { MediaSectionView } from './MediaSectionView';
import { OtherChannelVideoListView } from './OtherChannelVideoListView';
import { ChannelInfoView } from './ChannelInfoView';
import { FeaturedCommentView } from './FeaturedCommentView';
import { CommentsBottomSheet } from './CommentsBottomSheet';

// 메모이제이션된 탭 컴포넌트
function VideoTabView({ appBarOpacity }: { appBarOpacity: SharedValue<number> }) {
  useTabScrollListener(appBarOpacity);

  // 댓글 바텀시트 상태
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  // 바텀시트 열기/닫기 핸들러
  const handleShowComments = useCallback(() => {
    setIsCommentsVisible(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setIsCommentsVisible(false);
  }, []);

  return (
    <>
      <Tabs.ScrollView style={{ flex: 1 }}>
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
      </Tabs.ScrollView>

      {/* 전체 댓글 바텀시트 */}
      <CommentsBottomSheet visible={isCommentsVisible} onClose={handleCloseComments} />
    </>
  );
}

const MemoizedVideoTabView = React.memo(VideoTabView);
MemoizedVideoTabView.displayName = 'VideoTabView';

export { MemoizedVideoTabView as ContentTabView };
