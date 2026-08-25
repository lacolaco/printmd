import type { PaperFormat } from '../paper/paper-format';
import { px } from '../paper/units';
import type { PageSegment, Pagination, SegmentRange } from './pagination';

/** 実測したセグメントを順に受け取り、ページ組を組み立てる */
export class PaginationBuilder {
  private readonly segments: PageSegment[] = [];
  private firstPage = 0;

  constructor(private readonly format: PaperFormat) {}

  /** 段組ストリップの実測幅から、このセグメントのページ数と開始ページを決める */
  add(range: SegmentRange, clone: HTMLElement): void {
    const pages = this.format.pagesIn(px(clone.scrollWidth));
    this.segments.push({ ...range, pages, firstPage: this.firstPage });
    this.firstPage += pages;
  }

  build(): Pagination {
    return { segments: this.segments, total: this.firstPage };
  }
}
