import type { PaperFormat } from '../paper/paper-format';
import type { RenderedDocument } from '../markdown/rendered-document';
import type { Pagination, SegmentRange } from './pagination';
import { buildSegmentClone } from './segment-clone';
import { PaginationBuilder } from './pagination-builder';

/** 実レイアウトで測るための、画面外に置く使い捨ての領域 */
export class MeasuringArea {
  private readonly host = document.createElement('div');

  constructor() {
    this.host.className = 'measuring-area';
  }

  /** 掲示は全クローン構築後 (構築中の例外で DOM に残さない) */
  measure(doc: RenderedDocument, ranges: readonly SegmentRange[], format: PaperFormat): Pagination {
    const clones = this.cloneAll(doc, ranges);
    document.body.append(this.host);
    return this.collect(ranges, clones, format);
  }

  /** 計測中に何が起きても領域は取り除く */
  private collect(
    ranges: readonly SegmentRange[],
    clones: readonly HTMLElement[],
    format: PaperFormat,
  ): Pagination {
    try {
      return this.buildPagination(ranges, clones, format);
    } finally {
      this.host.remove();
    }
  }

  private buildPagination(
    ranges: readonly SegmentRange[],
    clones: readonly HTMLElement[],
    format: PaperFormat,
  ): Pagination {
    const builder = new PaginationBuilder(format);
    ranges.forEach((range, index) => builder.add(range, clones[index]));
    return builder.build();
  }

  private cloneAll(doc: RenderedDocument, ranges: readonly SegmentRange[]): HTMLElement[] {
    return ranges.map((range) => this.place(buildSegmentClone(doc, range.start, range.end)));
  }

  private place(clone: HTMLElement): HTMLElement {
    this.host.append(clone);
    return clone;
  }
}
