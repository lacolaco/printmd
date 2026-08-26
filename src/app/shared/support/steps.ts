/**
 * 段の一覧。現在の段から隣へ送る算術だけを持ち、両端では頭打ちになる。
 * 選べるものを段送りで扱う場所 (用紙書式・文字サイズ・表示倍率) が共有する
 */
export class Steps<T> {
  constructor(readonly items: readonly T[]) {}

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
