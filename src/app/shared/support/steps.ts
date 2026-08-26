/**
 * 段の一覧。段送りの算術と表示名を自分で答え、両端では頭打ちになる。
 * 選べるもの (用紙書式・文字サイズ・表示倍率) はどれもこの形で表す
 */
export class Steps<T> {
  constructor(
    readonly items: readonly T[],
    private readonly naming: (item: T) => string,
  ) {}

  /** 画面に出す段の名前 */
  nameOf(item: T): string {
    return this.naming(item);
  }

  /** delta ぶん隣の段 (両端では現在の段のまま) */
  next(current: T, delta: -1 | 1): T {
    return this.items[this.clamped(this.items.indexOf(current) + delta)];
  }

  /** delta 方向へまだ段を送れるか */
  isSteppable(current: T, delta: -1 | 1): boolean {
    const index = this.items.indexOf(current);
    return delta === -1 ? index > 0 : index < this.items.length - 1;
  }

  private clamped(index: number): number {
    return Math.min(this.items.length - 1, Math.max(0, index));
  }
}
