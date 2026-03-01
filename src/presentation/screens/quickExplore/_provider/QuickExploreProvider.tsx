/**
 * QuickExploreProvider - 빠른탐색 화면 상태 관리 프로바이더
 *
 * 빠른탐색 화면에서 사용하는 필터, 바텀시트, 채널 선택 등의 상태를 관리합니다.
 * 하위 컴포넌트에서 useQuickExplore() 훅으로 상태에 접근할 수 있습니다.
 *
 * @example
 * <QuickExploreProvider>
 *   <QuickExploreContent />
 * </QuickExploreProvider>
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentFilter } from '@/shared/context/ContentFilterContext';
import { channelSelectionBridge } from '@/features/channel/utils/channelSelectionBridge';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList } from '@/shared/navigation/types';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import type { BaseContentModel } from '@/presentation/types/content/baseContentModel';

/** ContentGrid에서 외부로 노출하는 메서드 */
interface ContentGridRef {
  focusOnRandomContent: () => void;
}

/** QuickExplore 컨텍스트 타입 */
interface QuickExploreContextType {
  // 필터 관련 상태
  /** 현재 적용된 필터 */
  readonly filter: ContentFilter;
  /** 필터 설정 함수 */
  readonly setFilter: (filter: ContentFilter) => void;
  /** 필터가 적용되었는지 여부 */
  readonly isFilterApplied: boolean;

  // 바텀시트 관련 상태
  /** 필터 바텀시트 표시 여부 */
  readonly isFilterVisible: boolean;
  /** 바텀시트 임시 필터 (채널 선택 페이지 복귀 시 사용) */
  readonly pendingFilter: ContentFilter | null;

  // 액션 핸들러
  /** 콘텐츠 클릭 핸들러 */
  readonly handleContentPress: (content: BaseContentModel) => void;
  /** 검색 버튼 클릭 핸들러 (랜덤 콘텐츠 포커스) */
  readonly handleSearchPress: () => void;
  /** 필터 버튼 클릭 핸들러 */
  readonly handleFilterPress: () => void;
  /** 필터 적용 핸들러 */
  readonly handleFilterApply: (newFilter: ContentFilter) => void;
  /** 바텀시트 닫기 핸들러 */
  readonly handleFilterClose: () => void;
  /** 채널 선택 페이지 이동 요청 핸들러 */
  readonly handleRequestChannelSelection: (tempFilter: ContentFilter) => void;
  /** 닫기 버튼 핸들러 */
  readonly handleClose: () => void;

  // Ref 관련
  /** ContentGrid ref */
  readonly gridRef: React.RefObject<ContentGridRef | null>;
}

const QuickExploreContext = createContext<QuickExploreContextType | undefined>(undefined);

interface QuickExploreProviderProps {
  readonly children: ReactNode;
}

/**
 * QuickExploreProvider - 빠른탐색 화면 상태 관리 프로바이더
 */
export function QuickExploreProvider({ children }: QuickExploreProviderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const gridRef = useRef<ContentGridRef>(null);

  // 공유 필터 컨텍스트에서 필터 상태 가져오기
  const { filter, setFilter, isFilterApplied } = useContentFilter();

  // 필터 바텀시트 표시 상태
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // 채널 선택 페이지에서 복귀 시 바텀시트를 복원하기 위한 임시 필터
  const [pendingFilter, setPendingFilter] = useState<ContentFilter | null>(null);

  // pendingFilter의 최신 값을 ref로 유지 (useFocusEffect 의존성 제거)
  const pendingFilterRef = useRef<ContentFilter | null>(null);
  pendingFilterRef.current = pendingFilter;

  // 채널 선택 페이지에서 복귀 시 결과 처리 (화면 포커스당 1회만 실행)
  useFocusEffect(
    useCallback(() => {
      const current = pendingFilterRef.current;
      if (current === null) return;

      const channelResult = channelSelectionBridge.consumeChannelResult();
      if (channelResult !== null) {
        // 채널 선택 결과를 반영한 필터로 바텀시트 재오픈
        setPendingFilter({ ...current, channelIds: channelResult });
      }
      // 결과 유무와 관계없이 pendingFilter가 있으면 바텀시트 복원
      setIsFilterVisible(true);
    }, []),
  );

  // 콘텐츠 클릭 핸들러
  const handleContentPress = useCallback(
    (content: BaseContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
      });
    },
    [navigation],
  );

  // 검색 버튼 클릭 핸들러 - 랜덤 콘텐츠 포커스
  const handleSearchPress = useCallback(() => {
    gridRef.current?.focusOnRandomContent();
  }, []);

  // 필터 버튼 클릭 핸들러
  const handleFilterPress = useCallback(() => {
    setPendingFilter(null);
    setIsFilterVisible(true);
  }, []);

  // 필터 적용 핸들러
  const handleFilterApply = useCallback(
    (newFilter: ContentFilter) => {
      setFilter(newFilter);
      setPendingFilter(null);
      setIsFilterVisible(false);
    },
    [setFilter],
  );

  // 바텀시트 닫기 핸들러
  const handleFilterClose = useCallback(() => {
    setPendingFilter(null);
    setIsFilterVisible(false);
  }, []);

  // 채널 선택 페이지 이동 요청 핸들러
  const handleRequestChannelSelection = useCallback(
    (tempFilter: ContentFilter) => {
      setPendingFilter(tempFilter);
      setIsFilterVisible(false);
      navigation.navigate(routePages.channelSelection, {
        selectedChannelIds: tempFilter.channelIds,
      });
    },
    [navigation],
  );

  // 닫기 버튼 핸들러
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 컨텍스트 값 메모이제이션
  const contextValue: QuickExploreContextType = useMemo(
    () => ({
      // 필터 관련 상태
      filter,
      setFilter,
      isFilterApplied,

      // 바텀시트 관련 상태
      isFilterVisible,
      pendingFilter,

      // 액션 핸들러
      handleContentPress,
      handleSearchPress,
      handleFilterPress,
      handleFilterApply,
      handleFilterClose,
      handleRequestChannelSelection,
      handleClose,

      // Ref
      gridRef,
    }),
    [
      filter,
      setFilter,
      isFilterApplied,
      isFilterVisible,
      pendingFilter,
      handleContentPress,
      handleSearchPress,
      handleFilterPress,
      handleFilterApply,
      handleFilterClose,
      handleRequestChannelSelection,
      handleClose,
    ],
  );

  return (
    <QuickExploreContext.Provider value={contextValue}>{children}</QuickExploreContext.Provider>
  );
}

/**
 * useQuickExplore - 빠른탐색 컨텍스트 접근 훅
 *
 * QuickExploreProvider 내부에서만 사용 가능합니다.
 *
 * @example
 * const { filter, handleFilterPress, isFilterApplied } = useQuickExplore();
 */
export function useQuickExplore(): QuickExploreContextType {
  const context = useContext(QuickExploreContext);
  if (context === undefined) {
    throw new Error('useQuickExplore must be used within a QuickExploreProvider');
  }
  return context;
}

export type { ContentGridRef, QuickExploreContextType };
