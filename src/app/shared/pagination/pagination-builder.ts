import { A4, MM_TO_PX } from './page-geometry';
import type { PageSegment, Pagination, SegmentRange } from './pagination';

function pagesForScrollWidth(scrollWidth: number): number {
  const raw = (scrollWidth + A4.column.gap * MM_TO_PX) / (A4.column.step * MM_TO_PX);
  return Math.max(1, Math.round(raw));
}

/** 実測したセグメントを順に受け取り、ページ組を組み立てる */
export class PaginationBuilder {
  private readonly segments: PageSegment[] = [];
  private firstPage = 0;

  /** 段組ストリップの実測幅から、このセグメントのページ数と開始ページを決める */
  add(range: SegmentRange, clone: HTMLElement): void {
    const pages = pagesForScrollWidth(clone.scrollWidth);
    this.segments.push({ ...range, pages, firstPage: this.firstPage });
    this.firstPage += pages;
  }

  build(): Pagination {
    return { segments: this.segments, total: this.firstPage };
  }
}
