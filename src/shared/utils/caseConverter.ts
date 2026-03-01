/**
 * snake_case를 camelCase로 변환하는 유틸리티
 */

/**
 * 문자열을 snake_case에서 camelCase로 변환
 */
const snakeToCamelString = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * 깊은 객체/배열의 모든 키를 snake_case에서 camelCase로 변환
 * @param obj 변환할 객체 또는 배열
 * @returns camelCase 키를 가진 새 객체/배열
 */
export const snakeToCamel = <T = any>(obj: any): T => {
  // null 또는 undefined 처리
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 배열 처리
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item)) as T;
  }

  // 객체가 아닌 기본 타입 처리
  if (typeof obj !== 'object') {
    return obj;
  }

  // Date 객체는 그대로 반환
  if (obj instanceof Date) {
    return obj as T;
  }

  // 객체 처리
  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamelString(key);
      converted[camelKey] = snakeToCamel(obj[key]);
    }
  }

  return converted as T;
};

/**
 * camelCase를 snake_case로 변환 (요청 시 사용)
 */
const camelToSnakeString = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * 깊은 객체/배열의 모든 키를 camelCase에서 snake_case로 변환
 * @param obj 변환할 객체 또는 배열
 * @returns snake_case 키를 가진 새 객체/배열
 */
export const camelToSnake = <T = any>(obj: any): T => {
  // null 또는 undefined 처리
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 배열 처리
  if (Array.isArray(obj)) {
    return obj.map((item) => camelToSnake(item)) as T;
  }

  // 객체가 아닌 기본 타입 처리
  if (typeof obj !== 'object') {
    return obj;
  }

  // Date 객체는 그대로 반환
  if (obj instanceof Date) {
    return obj as T;
  }

  // 객체 처리
  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnakeString(key);
      converted[snakeKey] = camelToSnake(obj[key]);
    }
  }

  return converted as T;
};
