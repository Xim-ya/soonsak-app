import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { LongRuntimeContentModel } from '../_types/longRuntimeContentModel.home';

const QUERY_KEY = 'longRuntimeContents';
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 러닝타임이 긴 콘텐츠를 조회하는 훅
 * 새로고침 시 랜덤 순서로 반환
 */
export function useLongRuntimeContents() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<LongRuntimeContentModel[]> => {
      const data = await contentApi.getLongRuntimeContents();
      const models = data.map(LongRuntimeContentModel.fromDto);
      return LongRuntimeContentModel.shuffle(models);
    },
    staleTime: STALE_TIME_MS,
  });
}
