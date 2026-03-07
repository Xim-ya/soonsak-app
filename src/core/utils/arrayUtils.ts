/**
 * 배열 유틸리티 함수
 *
 * 필터 칩 선택/해제 등 다중 선택 UI에서 공통으로 사용되는
 * 배열 토글 함수를 제공합니다.
 */

/** 배열에 항목이 있으면 제거, 없으면 추가 */
function toggleArrayItem<T>(array: readonly T[], item: T): T[] {
  return array.includes(item) ? array.filter((v) => v !== item) : [...array, item];
}

export { toggleArrayItem };
