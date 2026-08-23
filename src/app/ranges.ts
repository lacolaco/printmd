import type { Block } from './markdown/block-extractor';
import type { SegmentRange } from './page-count';

/** 強制改ページ位置で切った [start, end) の並び。切断判定と締めを閉じる */
export class Ranges {
  private readonly items: SegmentRange[] = [];
  private start = 0;

  cut(block: Block, index: number, breaks: ReadonlySet<string>): void {
    if (index !== 0 && (block.isFileBoundary || breaks.has(block.id))) {
      this.items.push({ start: this.start, end: index });
      this.start = index;
    }
  }

  close(end: number): SegmentRange[] {
    this.items.push({ start: this.start, end });
    return this.items;
  }
}
