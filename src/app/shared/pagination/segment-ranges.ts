import type { Block } from '../markdown/block';
import type { SegmentRange } from './pagination';

/** 強制改ページ位置で切った [start, end) の並び */
export class SegmentRanges {
  private readonly items: SegmentRange[] = [];
  private start = 0;

  /** このブロックが強制改ページなら、直前までを 1 区間として確定する */
  cutBefore(block: Block, index: number, breaks: ReadonlySet<string>): void {
    if (index !== 0 && (block.isFileBoundary || breaks.has(block.id))) {
      this.items.push({ start: this.start, end: index });
      this.start = index;
    }
  }

  /** 最後の区間を閉じて全区間を返す */
  closeAt(end: number): SegmentRange[] {
    this.items.push({ start: this.start, end });
    return this.items;
  }
}

/**
 * 強制改ページ (指定 Set とファイル境界) の位置で文書をセグメントへ分割する。
 * 画面の改ページは CSS の break-before に頼らず「セグメント = 独立した段組
 * ストリップ」で表現する。Firefox が段への強制改行を実装していないため、
 * どのエンジンでも起きる自然な流し込みだけに依存させる (印刷側は全エンジンが
 * 解する break-before: page のままクラスで表現する)
 */
export function splitAtForcedBreaks(
  blocks: readonly Block[],
  breaks: ReadonlySet<string>,
): SegmentRange[] {
  const ranges = new SegmentRanges();
  blocks.forEach((block, index) => ranges.cutBefore(block, index, breaks));
  return ranges.closeAt(blocks.length);
}
