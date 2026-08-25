import type { Block } from '../markdown/block-extractor';
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
