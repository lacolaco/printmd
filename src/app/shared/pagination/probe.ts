import type { RenderedDocument } from '../markdown/block-extractor';
import type { Pagination, SegmentRange } from './pagination';
import { buildSegmentClone } from './segment-clone';
import { tallySegments } from './tally';

/** 計測用の使い捨て DOM */
export class Probe {
  private readonly host = document.createElement('div');

  constructor() {
    this.host.className = 'preview-probe';
  }

  /** 掲示は全クローン構築後 (構築中の例外で DOM に残さない)。計測は破棄より先 */
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
