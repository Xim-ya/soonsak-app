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
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/native';
import { AppSize } from '@/presentation/utils/appSize';
import { toggleArrayItem } from '@/core/utils';
import { useChannelListBase, type ChannelListItem } from '@/features/channel';
import { channelApi } from '@/features/channel/api/channelApi';
import { ChannelGridItem } from '@/presentation/components/channel/ChannelGridItem';
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
  const { channels } = useChannelListBase();

  // 기본 프리뷰 목록 (API 순서 상위 8개, 최초 1회만 고정)
  const basePreviewRef = useRef<string[] | null>(null);
  if (channels.length > 0 && basePreviewRef.current === null) {
    basePreviewRef.current = channels.slice(0, MAX_PREVIEW_COUNT).map((ch) => ch.id);
  }

  // 로드된 채널에 없는 선택 ID 목록 (페이지네이션 외 채널 조회용)
  const loadedChannelIds = useMemo(() => new Set(channels.map((ch) => ch.id)), [channels]);
  const missingSelectedIds = useMemo(
    () => selectedChannelIds.filter((id) => !loadedChannelIds.has(id)),
    [selectedChannelIds, loadedChannelIds],
  );

  // 로드되지 않은 선택 채널 별도 조회
  const { data: missingChannels = [] } = useQuery({
    queryKey: ['channelsByIds', missingSelectedIds],
    queryFn: async () => {
      const dtos = await channelApi.getChannelsByIds(missingSelectedIds);
      return dtos.map(
        (dto): ChannelListItem => ({
          id: dto.id,
          name: dto.name ?? '',
          logoUrl: dto.logoUrl ?? '',
          ...(dto.subscriberCount != null && { subscriberCount: dto.subscriberCount }),
        }),
      );
    },
    enabled: missingSelectedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 로드된 채널 + 별도 조회한 채널 합치기
  const allChannels = useMemo(() => {
    const channelMap = new Map<string, ChannelListItem>();
    channels.forEach((ch) => channelMap.set(ch.id, ch));
    missingChannels.forEach((ch) => channelMap.set(ch.id, ch));
    return channelMap;
  }, [channels, missingChannels]);

  // 기본 프리뷰에 없는 선택 채널만 앞에 추가, 나머지는 원래 순서 유지
  const displayChannels = useMemo(() => {
    if (channels.length === 0) return [];

    const baseIds = basePreviewRef.current ?? [];
    const baseSet = new Set(baseIds);

    // 더보기에서 선택되었지만 기본 프리뷰에 없는 채널
    const extraSelected = selectedChannelIds
      .filter((id) => !baseSet.has(id))
      .map((id) => allChannels.get(id))
      .filter((ch): ch is NonNullable<typeof ch> => ch != null);

    // 기본 프리뷰 채널 (원래 순서 유지)
    const baseChannels = baseIds
      .map((id) => allChannels.get(id))
      .filter((ch): ch is NonNullable<typeof ch> => ch != null);

    return [...extraSelected, ...baseChannels];
  }, [channels, selectedChannelIds, allChannels]);

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
            <ChannelGridItem
              key={channel.id}
              logoUrl={channel.logoUrl ?? ''}
              name={channel.name ?? ''}
              avatarSize={AVATAR_SIZE}
              itemWidth={ITEM_WIDTH}
              selectable
              isSelected={isSelected}
              onPress={() => handleChannelToggle(channel.id)}
            />
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

export { ChannelFilterTab };
export type { ChannelFilterTabProps };
