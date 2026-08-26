/**
 * 選択肢の配列と、その上を動く操作。次の要素と表示名を自分で答え、両端では止まる。
 * 用紙書式や表示倍率のように、決まった候補から 1 つを選ぶものはこの形で表す
 */
export class Steps<T> {
  constructor(
    readonly items: readonly T[],
    private readonly naming: (item: T) => string,
  ) {}

  /** 画面に出す名前 */
  nameOf(item: T): string {
    return this.naming(item);
  }

  /** delta ぶん動いた先の要素 (両端と配列外では現在の値のまま) */
  next(current: T, delta: -1 | 1): T {
    const index = this.items.indexOf(current);
    return index === -1 ? current : this.items[this.clamped(index + delta)];
  }

  /** delta 方向へまだ動けるか (配列外の値からは動けない) */
  isSteppable(current: T, delta: -1 | 1): boolean {
    const index = this.items.indexOf(current);
    return index === -1 ? false : this.isInside(index, delta);
  }

  private isInside(index: number, delta: -1 | 1): boolean {
    return delta === -1 ? index > 0 : index < this.items.length - 1;
  }

  private clamped(index: number): number {
    return Math.min(this.items.length - 1, Math.max(0, index));
  }
}
