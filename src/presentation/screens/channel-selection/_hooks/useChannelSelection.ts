/**
 * useChannelSelection - 채널 선택 상태 관리 훅
 *
 * 전체 채널 목록을 조회하고, 선택/해제/초기화 기능을 제공합니다.
 * ChannelFilterTab과 동일한 queryKey를 사용하여 캐시를 공유합니다.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { channelApi } from '@/features/channel/api/channelApi';
import { analyticsService } from '@/shared/analytics';
import type { ChannelSelectionModel } from '../_types/channelSelectionModel';
import { channelSelectionFromDtos } from '../_types/channelSelectionModel';

interface UseChannelSelectionReturn {
  /** 전체 채널 목록 */
  readonly channels: ChannelSelectionModel[];
  /** 로딩 상태 */
  readonly isLoading: boolean;
  /** 현재 선택된 채널 ID 목록 */
  readonly selectedIds: string[];
  /** 초기 선택된 채널 ID 목록 (변경 수 계산용) */
  readonly initialSelectedIds: string[];
  /** 채널 선택/해제 토글 */
  readonly toggleChannel: (channelId: string) => void;
  /** 선택 초기화 */
  readonly resetSelection: () => void;
}

function useChannelSelection(initialSelectedIds: string[]): UseChannelSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  // 초기 선택 ID를 ref로 저장 (변경 수 계산용)
  const initialIdsRef = useRef<string[]>(initialSelectedIds);

  const { data: channelDtos = [], isLoading } = useQuery({
    queryKey: ['activeChannels'],
    queryFn: () => channelApi.getActiveChannels(),
    staleTime: 5 * 60 * 1000,
  });

  // DTO를 UI 모델로 변환
  const channels = useMemo(() => channelSelectionFromDtos(channelDtos), [channelDtos]);

  // 채널 ID로 채널명을 찾는 헬퍼 함수
  const getChannelNameById = useCallback(
    (channelId: string): string => {
      const channel = channels.find((ch) => ch.id === channelId);
      return channel?.name ?? '';
    },
    [channels],
  );

  const toggleChannel = useCallback(
    (channelId: string) => {
      const isCurrentlySelected = selectedIds.includes(channelId);
      const action = isCurrentlySelected ? 'deselect' : 'select';
      const channelName = getChannelNameById(channelId);

      // GA4 channel_selection_change 이벤트 로깅
      analyticsService.channelSelectionChange({
        channel_id: channelId,
        channel_name: channelName,
        action,
      });

      setSelectedIds((prev) =>
        prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
      );
    },
    [selectedIds, getChannelNameById],
  );

  const resetSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    channels,
    isLoading,
    selectedIds,
    initialSelectedIds: initialIdsRef.current,
    toggleChannel,
    resetSelection,
  };
}

export { useChannelSelection };
