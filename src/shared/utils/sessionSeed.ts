/**
 * sessionSeed - 앱 세션별 랜덤 시드 관리
 *
 * 앱이 시작될 때마다 새로운 시드가 생성되고,
 * 같은 세션에서는 동일한 시드를 반환합니다.
 */

// 앱 로드 시점에 0~1 사이 랜덤 시드 생성
// 모듈이 로드될 때 즉시 생성되어 핫 리로드에도 새 값 보장
const sessionSeed: number = Math.random();

// 디버깅: 시드 값 확인
console.log('[SessionSeed] Generated:', sessionSeed);

/**
 * 현재 세션의 랜덤 시드를 반환합니다.
 * 모듈 로드 시점에 생성된 고유 시드를 반환합니다.
 */
export function getSessionSeed(): number {
  return sessionSeed;
}

/**
 * 세션 시드를 리셋합니다.
 * (테스트용 또는 수동 새로고침 시 사용)
 * 참고: 현재 구조에서는 모듈 재로드 시에만 시드가 변경됩니다.
 */
export function resetSessionSeed(): void {
  // 모듈 레벨 상수이므로 리셋 불가
  // 앱 재시작 시 새 시드 생성됨
}
