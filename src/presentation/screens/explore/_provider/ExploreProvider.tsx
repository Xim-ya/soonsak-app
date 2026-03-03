/**
 * ExploreProvider - 탐색 화면 상태 관리 프로바이더
 *
 * 필터 상태, 바텀시트 제어, 로그인 다이얼로그 등
 * 탐색 화면에서 필요한 상태들을 Context로 통합 관리합니다.
 *
 * @example
 * <ExploreProvider>
 *   <ExploreContent />
 * </ExploreProvider>
 */

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import type { RootStackParamList } from '@/shared/navigation/types';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { ExploreContentModel } from '../_types/exploreTypes';
import { useExploreFilterSheet } from '../_hooks/useExploreFilterSheet';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Explore Context 타입 */
interface ExploreContextType {
  // 탐색 시드 (앱 진입 시 생성, 백그라운드 복귀 시 갱신)
  readonly exploreSeed: number;

  // 필터 관련 상태
  readonly filter: ContentFilter;
  readonly isVisible: boolean;
  readonly sheetFilter: ContentFilter;
  readonly hasPendingFilter: boolean;
  readonly isCustomFilterActive: boolean;

  // 필터 액션
  readonly toggleIncludeEnding: () => void;
  readonly toggleExcludeWatched: () => void;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly applyFilter: (newFilter: ContentFilter) => void;
  readonly requestChannelSelection: (tempFilter: ContentFilter) => void;

  // 로그인 다이얼로그 상태
  readonly isLoginDialogVisible: boolean;
  readonly loginSuccessCallback: (() => void) | undefined;
  readonly closeLoginDialog: () => void;

  // 네비게이션 핸들러
  readonly handleContentPress: (content: ExploreContentModel) => void;

  // 애니메이션 관련
  readonly gradientOpacity: SharedValue<number>;
}

const ExploreContext = createContext<ExploreContextType | undefined>(undefined);

interface ExploreProviderProps {
  readonly children: ReactNode;
}

/**
 * ExploreProvider - 탐색 화면 Context Provider
 *
 * useExploreFilterSheet 훅의 상태와 네비게이션 핸들러를 통합하여
 * 하위 컴포넌트에서 props drilling 없이 접근할 수 있도록 합니다.
 */
export function ExploreProvider({ children }: ExploreProviderProps) {
  const navigation = useNavigation<NavigationProp>();
  const gradientOpacity = useSharedValue(0);

  // 탐색 시드: 앱 진입 시 생성, 백그라운드 복귀 시 갱신 (전체 탭 랜덤 정렬용)
  const [exploreSeed, setExploreSeed] = useState(() => Math.random());
  const appStateRef = useRef(AppState.currentState);

  // 앱이 백그라운드에서 포그라운드로 돌아올 때 새로운 시드 생성
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        setExploreSeed(Math.random());
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // 필터 시트 관련 상태 및 액션
  const {
    filter,
    isVisible,
    sheetFilter,
    hasPendingFilter,
    isCustomFilterActive,
    toggleIncludeEnding,
    toggleExcludeWatched,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
  } = useExploreFilterSheet();

  // 콘텐츠 클릭 핸들러
  const handleContentPress = useCallback(
    (content: ExploreContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
      });
    },
    [navigation],
  );

  const contextValue: ExploreContextType = {
    // 탐색 시드
    exploreSeed,

    // 필터 관련 상태
    filter,
    isVisible,
    sheetFilter,
    hasPendingFilter,
    isCustomFilterActive,

    // 필터 액션
    toggleIncludeEnding,
    toggleExcludeWatched,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,

    // 로그인 다이얼로그 상태
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,

    // 네비게이션 핸들러
    handleContentPress,

    // 애니메이션 관련
    gradientOpacity,
  };

  return <ExploreContext.Provider value={contextValue}>{children}</ExploreContext.Provider>;
}

/**
 * useExplore - Explore Context 접근 훅
 *
 * ExploreProvider 내부에서만 사용 가능합니다.
 *
 * @example
 * const { filter, openSheet, handleContentPress } = useExplore();
 *
 * @throws {Error} ExploreProvider 외부에서 사용 시 에러 발생
 */
export function useExplore(): ExploreContextType {
  const context = useContext(ExploreContext);
  if (context === undefined) {
    throw new Error('useExplore must be used within an ExploreProvider');
  }
  return context;
}
