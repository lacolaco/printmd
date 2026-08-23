import { A4, MM_TO_PX } from './page-geometry';
import type { PageSegment, Pagination, SegmentRange } from './pagination';

function pagesForScrollWidth(scrollWidth: number): number {
  const raw = (scrollWidth + A4.column.gap * MM_TO_PX) / (A4.column.step * MM_TO_PX);
  return Math.max(1, Math.round(raw));
}

export class Tally {
  private readonly segments: PageSegment[] = [];
  private firstPage = 0;

  absorb(range: SegmentRange, clone: HTMLElement): void {
    const pages = pagesForScrollWidth(clone.scrollWidth);
    this.segments.push({ ...range, pages, firstPage: this.firstPage });
    this.firstPage += pages;
  }

  result(): Pagination {
    return { segments: this.segments, total: this.firstPage };
  }
}

export function tallySegments(
  ranges: readonly SegmentRange[],
  clones: readonly HTMLElement[],
): Pagination {
  const tally = new Tally();
  ranges.forEach((range, index) => tally.absorb(range, clones[index]));
  return tally.result();
}
