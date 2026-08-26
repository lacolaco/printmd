import { PaperFormat } from './paper-format';
import { mm } from './units';

/** A4 (210×297mm) */
export const A4 = new PaperFormat('A4', {
  width: mm(210),
  height: mm(297),
  margin: mm(16),
});

/** A3 (297×420mm) */
export const A3 = new PaperFormat('A3', {
  width: mm(297),
  height: mm(420),
  margin: mm(20),
});
/** B5 (JIS 182×257mm。ISO B5 ではない) */
export const B5 = new PaperFormat('B5', {
  width: mm(182),
  height: mm(257),
  margin: mm(14),
});

/** 選べる書式と、その中での前後の移動 */
class PaperCatalog {
  /** 画面に並べる順 */
  readonly formats: readonly PaperFormat[] = [A4, A3, B5];

  /** 既定の書式 */
  readonly initial: PaperFormat = A4;

  /** delta ぶん隣の書式 (両端と一覧外では現在の書式のまま) */
  next(current: PaperFormat, delta: -1 | 1): PaperFormat {
    const index = this.formats.indexOf(current);
    return index === -1 ? current : this.formats[this.clamped(index + delta)];
  }

  /** delta 方向へまだ変えられるか (一覧外の書式からは変えられない) */
  isChangeable(current: PaperFormat, delta: -1 | 1): boolean {
    const index = this.formats.indexOf(current);
    return index === -1 ? false : this.isInside(index, delta);
  }

  private isInside(index: number, delta: -1 | 1): boolean {
    return delta === -1 ? index > 0 : index < this.formats.length - 1;
  }

  private clamped(index: number): number {
    return Math.min(this.formats.length - 1, Math.max(0, index));
  }
}

export const PAPERS = new PaperCatalog();
