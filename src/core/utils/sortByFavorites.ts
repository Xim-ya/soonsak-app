/**
 * 찜한 항목을 앞으로 정렬하는 유틸리티 함수
 */

/**
 * 찜한 항목을 앞으로 정렬
 * @param items 정렬할 항목 배열
 * @param favoriteIds 찜한 항목 ID 배열
 * @param getId 항목에서 ID를 추출하는 함수
 * @returns 찜한 항목이 앞에 오도록 정렬된 배열
 */
export function sortByFavorites<T>(
  items: T[],
  favoriteIds: string[],
  getId: (item: T) => string,
): T[] {
  if (items.length === 0) return [];
  if (favoriteIds.length === 0) return items;

  const favoriteSet = new Set(favoriteIds);
  const favorites: T[] = [];
  const others: T[] = [];

  items.forEach((item) => {
    if (favoriteSet.has(getId(item))) {
      favorites.push(item);
    } else {
      others.push(item);
    }
  });

  return [...favorites, ...others];
}
