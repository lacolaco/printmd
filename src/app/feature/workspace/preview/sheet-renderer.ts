import type { RenderedDocument } from '../../../shared/markdown/block-extractor';
import type { PageSegment, Pagination } from '../../../shared/pagination/pagination';
import { buildSegmentClone } from '../../../shared/pagination/segment-clone';
import { ifDefined } from '../../../shared/collections';
import type { PaperFormat } from '../../../shared/paper/paper-format';

function isEmpty(sheet: HTMLElement): boolean {
  return sheet.childElementCount === 0;
}

function blankFrame(index: number): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.dataset['page'] = String(index + 1);
  return sheet;
}

function columnFor(segment: PageSegment, index: number): number {
  return index - segment.firstPage;
}

function segmentAt(pagination: Pagination, index: number): PageSegment | undefined {
  return pagination.segments.find((s) => index >= s.firstPage && index < s.firstPage + s.pages);
}

function clipWindow(
  doc: RenderedDocument,
  segment: PageSegment,
  column: number,
  format: PaperFormat,
): HTMLElement {
  const clip = document.createElement('div');
  clip.className = 'clip';
  clip.append(shiftedClone(doc, segment, column, format));
  return clip;
}

/**
 * セグメントのクローンを、セグメント内の段位置ぶん左へずらした状態で作る。
 * 紙面の複製は読み上げ・フォーカスの対象から外す (本文は原稿と印刷対象が担う)
 */
function shiftedClone(
  doc: RenderedDocument,
  segment: PageSegment,
  column: number,
  format: PaperFormat,
): HTMLElement {
  const mc = buildSegmentClone(doc, segment.start, segment.end);
  mc.style.marginLeft = `${-format.offsetAt(column)}mm`;
  mc.setAttribute('inert', '');
  return mc;
}

/** シート群の描画。空の枠を並べ、可視域に入ったシートだけ中身を実体化する (大部数対策) */
export class SheetRenderer {
  /** 可視シートの遅延実体化に使う */
  private observer: IntersectionObserver | null = null;
  /** シート要素 → ページ番号 (0 始まり) */
  private readonly pages = new WeakMap<HTMLElement, number>();

  constructor(
    private readonly host: HTMLElement,
    private readonly format: PaperFormat,
  ) {}

  render(doc: RenderedDocument | null, pagination: Pagination | null): void {
    this.dispose();
    this.host.replaceChildren();
    this.populate(doc, pagination);
  }

  dispose(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private populate(doc: RenderedDocument | null, pagination: Pagination | null): void {
    if (doc !== null && pagination !== null) {
      this.observer = this.createObserver(doc, pagination);
      this.mountAll(doc, pagination);
    }
  }

  private createObserver(
    doc: RenderedDocument,
    pagination: Pagination,
  ): IntersectionObserver | null {
    return typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => this.onIntersect(entries, doc, pagination), {
          rootMargin: '600px 0px',
        });
  }

  private onIntersect(
    entries: readonly IntersectionObserverEntry[],
    doc: RenderedDocument,
    pagination: Pagination,
  ): void {
    entries.forEach((entry) => this.handleEntry(entry, doc, pagination));
  }

  private handleEntry(
    entry: IntersectionObserverEntry,
    doc: RenderedDocument,
    pagination: Pagination,
  ): void {
    if (entry.isIntersecting) {
      this.fill(entry.target as HTMLElement, doc, pagination);
      this.observer?.unobserve(entry.target);
    }
  }

  private mountAll(doc: RenderedDocument, pagination: Pagination): void {
    const { total } = pagination;
    for (let index = 0; index < total; index++) {
      this.placeSheet(index, doc, pagination);
    }
  }

  private placeSheet(index: number, doc: RenderedDocument, pagination: Pagination): void {
    const sheet = blankFrame(index);
    this.pages.set(sheet, index);
    this.host.append(sheet);
    this.schedule(sheet, doc, pagination);
  }

  private schedule(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    this.observe(sheet);
    this.preload(sheet, doc, pagination);
  }

  private observe(sheet: HTMLElement): void {
    if (this.observer !== null) {
      this.observer.observe(sheet);
    }
  }

  /** 監視できない環境では可視域を待たずに入れる */
  private preload(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (this.observer === null) {
      this.fill(sheet, doc, pagination);
    }
  }

  private fill(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (isEmpty(sheet)) {
      this.insertClip(sheet, this.pages.get(sheet) ?? NaN, doc, pagination);
    }
  }

  private insertClip(
    sheet: HTMLElement,
    index: number,
    doc: RenderedDocument,
    pagination: Pagination,
  ): void {
    ifDefined(segmentAt(pagination, index), (segment) =>
      sheet.append(clipWindow(doc, segment, columnFor(segment, index), this.format)),
    );
  }
}
