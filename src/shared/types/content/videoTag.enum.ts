/**
 * 비디오 태그 타입 및 설정
 *
 * 비디오에 표시되는 태그(결말 포함, 스포일러 주의 등)의
 * 타입과 라벨을 정의합니다.
 *
 * @example
 * import { videoTagConfigs } from '@/shared/types/content/videoTag.enum';
 * <DarkChip content={videoTagConfigs.includesEnding.label} />
 */

// 태크추가 예시) 'spoilerAlert' | 'adultOnly'
export type VideoTagType = 'includesEnding';

interface VideoTagConfig {
  label: string;
}

export const videoTagConfigs: Record<VideoTagType, VideoTagConfig> = {
  includesEnding: { label: '결말 포함' },
  // 태크추가 예시)
  // spoilerAlert: { label: '스포일러 주의' },
  // adultOnly: { label: '19금' },
};
