import type { RenderedDocument } from './markdown/block-extractor';
import type { Pagination, SegmentRange } from './pagination';
import { buildSegmentClone } from './segment-clone';
import { tallySegments } from './tally';

/** 計測用の使い捨て DOM。生成・複製の掲示・計測・破棄を 1 か所に閉じる */
export class Probe {
  private readonly host = document.createElement('div');

  constructor() {
    this.host.className = 'preview-probe';
  }

  /** 全クローンの構築後に掲示し、計測してから自身を破棄する (計測は必ず破棄より先) */
  measure(doc: RenderedDocument, ranges: readonly SegmentRange[]): Pagination {
    const clones = this.mount(doc, ranges);
    document.body.append(this.host);
    const result = tallySegments(ranges, clones);
    this.host.remove();
    return result;
  }

  private mount(doc: RenderedDocument, ranges: readonly SegmentRange[]): HTMLElement[] {
    return ranges.map((range) => this.adopt(buildSegmentClone(doc, range.start, range.end)));
  }

  private adopt(clone: HTMLElement): HTMLElement {
    this.host.append(clone);
    return clone;
  }
}
