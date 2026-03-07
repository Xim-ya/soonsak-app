export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
