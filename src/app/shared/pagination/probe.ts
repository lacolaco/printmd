import type { PaperFormat } from '../paper/paper-format';
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
  measure(doc: RenderedDocument, ranges: readonly SegmentRange[], format: PaperFormat): Pagination {
    const clones = this.cloneAll(doc, ranges);
    document.body.append(this.host);
    const result = tallySegments(ranges, clones, format);
    this.host.remove();
    return result;
  }

  private cloneAll(doc: RenderedDocument, ranges: readonly SegmentRange[]): HTMLElement[] {
    return ranges.map((range) => this.place(buildSegmentClone(doc, range.start, range.end)));
  }

  private place(clone: HTMLElement): HTMLElement {
    this.host.append(clone);
    return clone;
  }
}
