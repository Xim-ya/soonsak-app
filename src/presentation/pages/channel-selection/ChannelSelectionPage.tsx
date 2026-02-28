/**
 * ChannelSelectionPage - 전체 채널 선택 페이지
 *
 * 활성화된 전체 채널을 3열 그리드로 표시합니다.
 * 채널 로고, 이름, 구독자 수를 보여주며 다중 선택을 지원합니다.
 * 앱바 우측에 "초기화" 텍스트 버튼, 하단에 LinearGradient + "적용하기" 버튼 배치
 * "적용" 시 channelSelectionBridge를 통해 결과를 전달하고 뒤로 돌아갑니다.
 */

import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import styled from '@emotion/native';
import textStyles from '@/shared/styles/textStyles';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import { channelSelectionBridge } from '@/shared/utils/channelSelectionBridge';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { ChannelGridItem } from '@/presentation/components/channel/ChannelGridItem';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import type { ChannelSelectionModel } from './_types/channelSelectionModel';
import { useChannelSelection } from './_hooks/useChannelSelection';

/** 3열 그리드 설정 (ChannelAllPage와 동일) */
const COLUMN_COUNT = 3;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = AppSize.ratioWidth(31);
const GRID_ROW_GAP = AppSize.ratioWidth(28);
const ITEM_WIDTH =
  (AppSize.screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;
/** 아바타 크기 (ChannelAllPage와 동일: itemWidth - 16) */
const AVATAR_SIZE = ITEM_WIDTH - 16;
/** 하단 버튼 영역 높이 */
const BOTTOM_AREA_HEIGHT = 56 + AppSize.bottomInset + 12;
/** 그라데이션 높이 */
const GRADIENT_HEIGHT = 40;

type ChannelSelectionRouteProp = RouteProp<RootStackParamList, typeof routePages.channelSelection>;

export default function ChannelSelectionPage(): React.ReactElement {
  const navigation = useNavigation();
  const route = useRoute<ChannelSelectionRouteProp>();
  const { selectedChannelIds } = route.params;

  const { channels, selectedIds, toggleChannel, resetSelection } =
    useChannelSelection(selectedChannelIds);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    channelSelectionBridge.setChannelResult(selectedIds);
    navigation.goBack();
  }, [selectedIds, navigation]);

  // 초기화 액션 버튼
  const resetAction = (
    <TouchableOpacity onPress={resetSelection} activeOpacity={0.7}>
      <ResetActionText>초기화</ResetActionText>
    </TouchableOpacity>
  );

  // 채널 아이템 렌더링
  const renderChannelItem = useCallback(
    ({ item }: ListRenderItemInfo<ChannelSelectionModel>) => {
      const isSelected = selectedIds.includes(item.id);

      return (
        <ChannelGridItem
          logoUrl={item.logoUrl ?? ''}
          name={item.name}
          subscriberCount={item.subscriberCount}
          avatarSize={AVATAR_SIZE}
          itemWidth={ITEM_WIDTH}
          selectable
          isSelected={isSelected}
          onPress={() => toggleChannel(item.id)}
        />
      );
    },
    [selectedIds, toggleChannel],
  );

  const keyExtractor = useCallback((item: ChannelSelectionModel) => item.id, []);

  return (
    <BasePage useSafeArea>
      <BackButtonAppBar title="채널 선택" actions={[resetAction]} />
      <FlatList
        data={channels}
        keyExtractor={keyExtractor}
        renderItem={renderChannelItem}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={GRID_CONTENT_CONTAINER_STYLE}
        columnWrapperStyle={GRID_COLUMN_WRAPPER_STYLE}
        showsVerticalScrollIndicator={false}
      />

      {/* 하단 적용 버튼 영역 */}
      <BottomContainer>
        <DarkedLinearShadow height={GRADIENT_HEIGHT} align={LinearAlign.bottomTop} />
        <ApplyButtonArea>
          <ApplyButton onPress={handleApply} activeOpacity={0.8}>
            <ApplyText>적용하기</ApplyText>
          </ApplyButton>
        </ApplyButtonArea>
      </BottomContainer>
    </BasePage>
  );
}

const GRID_CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: GRID_HORIZONTAL_PADDING,
  paddingTop: 20,
  paddingBottom: BOTTOM_AREA_HEIGHT + GRADIENT_HEIGHT,
} as const;

const GRID_COLUMN_WRAPPER_STYLE = { gap: GRID_COLUMN_GAP, marginBottom: GRID_ROW_GAP } as const;

/* Styled Components */

const ResetActionText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const BottomContainer = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
});

const ApplyButtonArea = styled.View({
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: AppSize.bottomInset + 8,
  backgroundColor: colors.black,
});

const ApplyButton = styled.TouchableOpacity({
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingVertical: 14,
  alignItems: 'center',
});

const ApplyText = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});
