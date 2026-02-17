/**
 * WatchProgressBar - 시청 진행률 프로그레스 바
 *
 * YouTube 스타일 프로그레스 바 정책을 적용한 공통 컴포넌트
 * - 최소 1% 또는 10초 이상 시청해야 표시
 * - 95% 이상 또는 남은 10초 이하면 완료로 간주하여 미표시
 */

import { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/shared/styles/colors';

/* Types */

interface WatchProgressBarProps {
  /** 시청한 시간 (초) */
  readonly progressSeconds: number;
  /** 전체 영상 길이 (초) */
  readonly durationSeconds: number;
  /** 프로그레스 바 높이 (기본값: 3) */
  readonly height?: number;
  /** 프로그레스 바 색상 (기본값: YouTube 빨간색) */
  readonly fillColor?: string;
  /** 배경 색상 (기본값: 반투명 흰색) */
  readonly backgroundColor?: string;
  /** 테두리 둥글기 (기본값: 0) */
  readonly borderRadius?: number;
  /** 컨테이너 스타일 */
  readonly style?: ViewStyle;
}

/* Constants */

/** YouTube 스타일 프로그레스 바 정책 */
export const WATCH_PROGRESS_POLICY = {
  /** 최소 표시 기준: 전체의 1% 이상 */
  MIN_PERCENT: 1,
  /** 최소 표시 기준: 10초 이상 시청 */
  MIN_SECONDS: 10,
  /** 완료 기준: 95% 이상이면 완료로 처리 */
  COMPLETION_PERCENT: 95,
  /** 완료 기준: 남은 시간 10초 이하면 완료로 처리 */
  COMPLETION_REMAINING_SECONDS: 10,
} as const;

/* Helpers */

/**
 * YouTube 스타일 프로그레스 바 표시 여부 결정
 * - 최소 1% 이상 또는 10초 이상 시청해야 표시
 * - 95% 이상 또는 남은 10초 이하면 완료로 간주하여 미표시
 */
export function shouldShowProgressBar(progressSeconds: number, durationSeconds: number): boolean {
  const hasValidDuration = durationSeconds > 0 && progressSeconds > 0;
  if (!hasValidDuration) return false;

  const percent = (progressSeconds / durationSeconds) * 100;
  const remainingSeconds = durationSeconds - progressSeconds;

  const hasStartedWatching =
    percent >= WATCH_PROGRESS_POLICY.MIN_PERCENT ||
    progressSeconds >= WATCH_PROGRESS_POLICY.MIN_SECONDS;

  const hasCompletedWatching =
    percent >= WATCH_PROGRESS_POLICY.COMPLETION_PERCENT ||
    remainingSeconds <= WATCH_PROGRESS_POLICY.COMPLETION_REMAINING_SECONDS;

  return hasStartedWatching && !hasCompletedWatching;
}

/**
 * 진행률 퍼센트 계산 (0~100)
 */
export function calculateProgressPercent(progressSeconds: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.min((progressSeconds / durationSeconds) * 100, 100);
}

/* Component */

function WatchProgressBarComponent({
  progressSeconds,
  durationSeconds,
  height = 3,
  fillColor = colors.red,
  backgroundColor = 'rgba(255, 255, 255, 0.3)',
  borderRadius = 0,
  style,
}: WatchProgressBarProps) {
  const showProgressBar = shouldShowProgressBar(progressSeconds, durationSeconds);

  if (!showProgressBar) return null;

  const progressPercent = calculateProgressPercent(progressSeconds, durationSeconds);

  return (
    <View style={[styles.container, { height, borderRadius }, style]}>
      <View style={[styles.background, { backgroundColor, borderRadius }]} />
      <View
        style={[
          styles.fill,
          {
            width: `${progressPercent}%`,
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
});

export const WatchProgressBar = memo(WatchProgressBarComponent);
