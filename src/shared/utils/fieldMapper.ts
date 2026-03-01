/**
 * 사용자 정의 필드 매핑과 함께 변환
 */
export function mapWithField<T = any>(obj: any, customMapping: Record<string, string> = {}): T {
  function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  const mergedMapping = { ...customMapping };

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapWithField(item, customMapping)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const convertedObj: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // 커스텀 매핑이 있으면 사용, 없으면 자동 camelCase 변환
      const newKey = mergedMapping[key] || toCamelCase(key);
      convertedObj[newKey] = mapWithField(value, customMapping);
    }

    return convertedObj as T;
  }

  return obj;
}
