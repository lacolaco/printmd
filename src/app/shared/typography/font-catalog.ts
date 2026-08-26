import { FontSize } from './font-size';

const NINE = new FontSize(9);
const TEN = new FontSize(10);
const TEN_HALF = new FontSize(10.5);
const ELEVEN = new FontSize(11);
const TWELVE = new FontSize(12);
const FOURTEEN = new FontSize(14);

/** 選べる文字サイズと、その中での前後の移動 */
class FontCatalog {
  /** 小さい順 */
  readonly sizes: readonly FontSize[] = [NINE, TEN, TEN_HALF, ELEVEN, TWELVE, FOURTEEN];

  /** 既定。1pt = 4/3px なので 12pt はちょうど 16px (github-markdown-css の既定と一致) */
  readonly initial: FontSize = TWELVE;

  /** delta ぶん隣の文字サイズ (両端と一覧外では現在の値のまま) */
  next(current: FontSize, delta: -1 | 1): FontSize {
    const index = this.sizes.indexOf(current);
    return index === -1 ? current : this.sizes[this.clamped(index + delta)];
  }

  /** delta 方向へまだ変えられるか (一覧外の値からは変えられない) */
  isChangeable(current: FontSize, delta: -1 | 1): boolean {
    const index = this.sizes.indexOf(current);
    return index === -1 ? false : this.isInside(index, delta);
  }

  private isInside(index: number, delta: -1 | 1): boolean {
    return delta === -1 ? index > 0 : index < this.sizes.length - 1;
  }

  private clamped(index: number): number {
    return Math.min(this.sizes.length - 1, Math.max(0, index));
  }
}

export const SIZES = new FontCatalog();
