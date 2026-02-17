import { useCurrentTabScrollY } from 'react-native-collapsible-tab-view';
import { useAnimatedReaction, type SharedValue } from 'react-native-reanimated';

/** opacity 변화가 시작되는 스크롤 오프셋 */
export const OPACITY_START_OFFSET = 200;
/** opacity가 1에 도달하는 스크롤 오프셋 */
export const OPACITY_END_OFFSET = 269;

/**
 * 탭 스크롤 이벤트를 감지하여 AppBar 투명도를 직접 제어하는 커스텀 훅
 *
 * 주요 기능:
 * - react-native-collapsible-tab-view의 스크롤 Y 값 실시간 감지
 * - UI 스레드(worklet)에서 직접 opacity 계산 (JS 스레드 전환 없음)
 * - 스크롤 오프셋 200px~269px 구간에서 비례적 opacity 변화
 *
 * @param appBarOpacity - AppBar 투명도를 제어하는 SharedValue
 */
const useTabScrollListener = (appBarOpacity: SharedValue<number>) => {
  const scrollY = useCurrentTabScrollY();

  useAnimatedReaction(
    () => scrollY.value,
    (offset) => {
      'worklet';
      let targetOpacity: number;

      if (offset <= OPACITY_START_OFFSET) {
        targetOpacity = 0;
      } else if (offset >= OPACITY_END_OFFSET) {
        targetOpacity = 1;
      } else {
        targetOpacity =
          (offset - OPACITY_START_OFFSET) / (OPACITY_END_OFFSET - OPACITY_START_OFFSET);
      }

      appBarOpacity.value = targetOpacity;
    },
    [appBarOpacity],
  );
};

export { useTabScrollListener };
