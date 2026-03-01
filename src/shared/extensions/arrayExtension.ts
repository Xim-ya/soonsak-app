export {};

declare global {
  interface Array<T> {
    isEmpty(): boolean;
  }
}
/**
 * 배열이 비어있는지 확인하는 메서드
 */
if (!Array.prototype.isEmpty) {
  Array.prototype.isEmpty = function () {
    return this.length === 0;
  };
}
