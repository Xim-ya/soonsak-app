import { useRoute } from '@react-navigation/native';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';

/**
 * useContentDetailRoute - ContentDetail 페이지의 route params를 가져오는 훅
 *
 * ContentDetailPage와 그 하위 컴포넌트에서 프롭 드릴링 없이
 * route parameters(id, title, type)에 접근할 수 있습니다.
 *
 * @example
 * // 기본 사용법
 * const { id, title, type } = useContentDetailRoute();
 *
 * // 특정 값만 사용
 * const { title } = useContentDetailRoute();
 */
export const useContentDetailRoute = () => {
  const route = useRoute<ScreenRouteProp<typeof routePages.contentDetail>>();
  return route.params;
};
