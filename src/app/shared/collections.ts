export function isNonEmpty(items: readonly unknown[]): boolean {
  return items.length > 0;
}

/** prev が next の先頭部分か (要素は同一参照) */
export function isPrefixOf<T>(prev: readonly T[], next: readonly T[]): boolean {
  return prev.length <= next.length && prev.every((item, index) => next[index] === item);
}
