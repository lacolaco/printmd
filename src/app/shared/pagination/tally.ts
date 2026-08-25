import type { PaperFormat } from '../paper/paper-format';
import type { PageSegment, Pagination, SegmentRange } from './pagination';

export class Tally {
  private readonly segments: PageSegment[] = [];
  private firstPage = 0;

  constructor(private readonly format: PaperFormat) {}

  add(range: SegmentRange, clone: HTMLElement): void {
    const pages = this.format.pagesIn(clone.scrollWidth);
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
  format: PaperFormat,
): Pagination {
  const tally = new Tally(format);
  ranges.forEach((range, index) => tally.add(range, clones[index]));
  return tally.result();
}
