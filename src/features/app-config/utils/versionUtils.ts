/**
 * versionUtils - 버전 비교 유틸리티
 *
 * Semantic Versioning 기반 버전 비교 함수
 */

/**
 * 버전 문자열을 숫자 배열로 파싱
 * @example "2.5.0" → [2, 5, 0]
 * @example "2.5.0-beta.1" → [2, 5, 0] (prerelease 제외)
 */
function parseVersion(version: string): number[] {
  // prerelease 부분 제거 (예: -beta.1, -rc.2)
  const cleanVersion = version.replace(/-.*$/, '');
  return cleanVersion.split('.').map((part) => parseInt(part, 10) || 0);
}

/**
 * 두 버전 비교
 * @returns 1 (v1 > v2), -1 (v1 < v2), 0 (v1 === v2)
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);

  // 최대 3자리 비교 (major.minor.patch)
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * v1이 v2보다 낮은 버전인지 확인
 */
export function isVersionLowerThan(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) < 0;
}

/**
 * v1이 v2보다 높거나 같은 버전인지 확인
 */
export function isVersionAtLeast(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) >= 0;
}
