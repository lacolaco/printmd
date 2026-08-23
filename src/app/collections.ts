/** 配列に要素があるか。「呼び出すか渡すか」の規律で length アクセスを局所化する */
export function hasItems(items: readonly unknown[]): boolean {
  return items.length > 0;
}
