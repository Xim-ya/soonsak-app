/**
 * ChannelFilterTab - 바텀시트 내 채널 필터 프리뷰
 *
 * 기본 2×4 그리드로 채널을 표시합니다.
 * 기본 8개 채널은 원래 순서를 유지하며, 더보기 페이지에서 선택된
 * 프리뷰 외 채널만 앞에 추가됩니다.
 *
 * @example
 * <ChannelFilterTab
 *   selectedChannelIds={['UC...']}
 *   onChannelIdsChange={(ids) => updateFilter({ channelIds: ids })}
 *   onMorePress={() => navigateToChannelSelection()}
 * />
 */

import React, { useCallback, useMemo, useRef } from 'react';
import styled from '@emotion/native';
import { useQuery } from '@tanstack/react-query';
import textStyles from '@/shared/styles/textStyles';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { toggleArrayItem } from '@/shared/utils/arrayUtils';
import { channelApi } from '@/features/channel/api/channelApi';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import { ChannelAvatarWrapper } from '@/presentation/components/channel/ChannelAvatarWrapper';
import { FilterSectionHeader } from '../FilterSectionHeader';

/** 프리뷰에 표시할 최대 채널 수 */
const MAX_PREVIEW_COUNT = 8;
/** 좌우 패딩 (FilterSectionHeader의 paddingHorizontal과 동일) */
const HORIZONTAL_PADDING = 20;
/** 열 간격 */
const COLUMN_GAP = 12;
/** 4열 그리드 아이템 너비 */
const ITEM_WIDTH = (AppSize.screenWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP * 3) / 4;
/** 아바타 크기 (채널 선택 페이지와 동일) */
const AVATAR_SIZE = 72;

interface ChannelFilterTabProps {
  /** 현재 선택된 채널 ID 목록 */
  readonly selectedChannelIds: string[];
  /** 채널 ID 목록 변경 콜백 */
  readonly onChannelIdsChange: (ids: string[]) => void;
  /** 더보기 버튼 콜백 */
  readonly onMorePress: () => void;
}

function ChannelFilterTab({
  selectedChannelIds,
  onChannelIdsChange,
  onMorePress,
}: ChannelFilterTabProps): React.ReactElement {
  const { data: channels = [] } = useQuery({
    queryKey: ['activeChannels'],
    queryFn: () => channelApi.getActiveChannels(),
    staleTime: 5 * 60 * 1000,
  });

  // 기본 프리뷰 목록 (API 순서 상위 8개, 최초 1회만 고정)
  const basePreviewRef = useRef<string[] | null>(null);
  if (channels.length > 0 && basePreviewRef.current === null) {
    basePreviewRef.current = channels.slice(0, MAX_PREVIEW_COUNT).map((ch) => ch.id);
  }

  // 기본 프리뷰에 없는 선택 채널만 앞에 추가, 나머지는 원래 순서 유지
  const displayChannels = useMemo(() => {
    if (channels.length === 0) return [];

    const baseIds = basePreviewRef.current ?? [];
    const baseSet = new Set(baseIds);

    // 더보기에서 선택되었지만 기본 프리뷰에 없는 채널
    const extraSelected = selectedChannelIds
      .filter((id) => !baseSet.has(id))
      .map((id) => channels.find((ch) => ch.id === id))
      .filter((ch): ch is NonNullable<typeof ch> => ch != null);

    // 기본 프리뷰 채널 (원래 순서 유지)
    const baseChannels = baseIds
      .map((id) => channels.find((ch) => ch.id === id))
      .filter((ch): ch is NonNullable<typeof ch> => ch != null);

    return [...extraSelected, ...baseChannels];
  }, [channels, selectedChannelIds]);

  // 채널 선택/해제 토글
  const handleChannelToggle = useCallback(
    (channelId: string) => {
      onChannelIdsChange(toggleArrayItem(selectedChannelIds, channelId));
    },
    [selectedChannelIds, onChannelIdsChange],
  );

  return (
    <>
      <FilterSectionHeader title="채널" onMorePress={onMorePress} />
      <ChannelGrid>
        {displayChannels.map((channel) => {
          const isSelected = selectedChannelIds.includes(channel.id);
          return (
            <ChannelItem key={channel.id} onPress={() => handleChannelToggle(channel.id)}>
              <ChannelAvatarWrapper isSelected={isSelected} avatarSize={AVATAR_SIZE}>
                <ChannelLogoImage source={channel.logoUrl ?? ''} size={AVATAR_SIZE} />
              </ChannelAvatarWrapper>
              <ChannelName numberOfLines={1} isSelected={isSelected}>
                {channel.name ?? ''}
              </ChannelName>
            </ChannelItem>
          );
        })}
      </ChannelGrid>
    </>
  );
}

/* Styled Components */

const ChannelGrid = styled.View({
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingHorizontal: HORIZONTAL_PADDING,
  columnGap: COLUMN_GAP,
  rowGap: 12,
});

const ChannelItem = styled.TouchableOpacity({
  width: ITEM_WIDTH,
  alignItems: 'center',
});

const ChannelName = styled.Text<{ isSelected: boolean }>(({ isSelected }) => ({
  ...textStyles.desc,
  color: isSelected ? colors.white : colors.gray03,
  marginTop: 4,
  textAlign: 'center',
}));

export { ChannelFilterTab };
export type { ChannelFilterTabProps };
