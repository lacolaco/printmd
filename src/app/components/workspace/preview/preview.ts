import { Component, DestroyRef, effect, inject, viewChild, type ElementRef } from '@angular/core';
import type { RenderedDocument } from '../../../markdown/block-extractor';
import { buildSegmentClone, type PageSegment, type Pagination } from '../../../page-count';
import { EditorStore } from '../../../state/editor-store';
import { ViewerState } from '../../../state/viewer-state';
import { COLUMN_STEP_MM } from '../../../page-geometry';


/**
 * プレビュー: CSS 多段組を流用したページ分割。変換済み文書の要素を段幅 178mm の
 * 多段組コンテナへ複製し、段 i だけを見せる窓 (178mm × 265mm, overflow
 * hidden) を A4 シートとして縦に積む。
 * 改ページの指定は右カラムの調整パネルが担い、紙面は表示専用
 */
@Component({
  selector: 'app-preview',
  template: `
    <div class="relative flex h-full min-h-0 flex-col">
      <div
        class="app-workspace min-h-0 flex-1 overflow-auto py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-700"
        tabindex="0"
        role="region"
        aria-label="紙面 (矢印キーでスクロール。各ページのブロック境界に改ページ指定ボタンがあります)"
      >
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="viewer.zoom()"></div>
      </div>
      <!-- 読み上げはヘッダの status が担うため、こちらは視覚専用 -->
      @if (store.rendering()) {
        <div
          class="app-rendering-indicator pointer-events-none absolute inset-x-0 top-4 flex justify-center"
          aria-hidden="true"
        >
          <span class="animate-pulse rounded-full bg-stone-800/85 px-3 py-1 text-xs text-white">
            変換中…
          </span>
        </div>
      }
    </div>
  `,
})
export class Preview {
  protected readonly store = inject(EditorStore);
  protected readonly viewer = inject(ViewerState);

  private readonly sheetsHost = viewChild.required<ElementRef<HTMLElement>>('sheetsHost');

  /** 計測は pagination (computed) に移っており、ここは DOM 書き込みのみ */
  constructor() {
    effect(() => this.rebuild(this.store.renderedDocument(), this.viewer.pagination()));
    // rebuild 間の張り替えでは最後の observer が残るため、破棄時に切断する
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  /** 可視シートの遅延実体化に使う。rebuild ごとに張り直す */
  private observer: IntersectionObserver | null = null;

  private rebuild(doc: RenderedDocument | null, pagination: Pagination | null): void {
    this.resetSheets();
    if (doc === null || pagination === null) return;
    this.observer = this.createObserver(doc, pagination);
    this.appendSheets(doc, pagination);
  }

  private resetSheets(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.sheetsHost().nativeElement.replaceChildren();
  }

  /** 大部数対策: シートは空の枠だけ並べ、可視域に入ったものだけ中身を実体化する */
  private createObserver(
    doc: RenderedDocument,
    pagination: Pagination,
  ): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') return null;
    return new IntersectionObserver((entries) => this.fillVisibleSheets(entries, doc, pagination), {
      rootMargin: '600px 0px',
    });
  }

  private fillVisibleSheets(
    entries: readonly IntersectionObserverEntry[],
    doc: RenderedDocument,
    pagination: Pagination,
  ): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      this.fillSheet(entry.target as HTMLElement, doc, pagination);
      this.observer?.unobserve(entry.target);
    }
  }

  private appendSheets(doc: RenderedDocument, pagination: Pagination): void {
    const host = this.sheetsHost().nativeElement;
    const total = pageTotal(pagination);
    for (let index = 0; index < total; index++) this.appendSheet(host, index, doc, pagination);
  }

  private appendSheet(host: HTMLElement, index: number, doc: RenderedDocument, pagination: Pagination): void {
    const sheet = createSheet(index);
    host.append(sheet);
    this.scheduleFill(sheet, doc, pagination);
  }

  private scheduleFill(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (this.observer !== null) this.observer.observe(sheet);
    else this.fillSheet(sheet, doc, pagination);
  }

  /** シートへ段組クローンの窓を実体化する。実体化済みなら何もしない */
  private fillSheet(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (sheet.childElementCount > 0) return;
    const index = Number(sheet.dataset['page']) - 1;
    const segment = segmentForPage(pagination, index);
    if (segment !== undefined) {
      sheet.append(buildSheetWindow(doc, segment, columnFor(segment, index)));
    }
  }
}

function createSheet(index: number): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.dataset['page'] = String(index + 1);
  return sheet;
}

function pageTotal(pagination: Pagination): number {
  return pagination.total;
}

function columnFor(segment: PageSegment, index: number): number {
  return index - segment.firstPage;
}

function segmentForPage(pagination: Pagination, index: number): PageSegment | undefined {
  return pagination.segments.find((s) => index >= s.firstPage && index < s.firstPage + s.pages);
}

function buildSheetWindow(doc: RenderedDocument, segment: PageSegment, column: number): HTMLElement {
  const clip = document.createElement('div');
  clip.className = 'clip';
  clip.append(buildWindowClone(doc, segment, column));
  return clip;
}

/**
 * セグメントのクローンを、セグメント内の段位置ぶん左へずらした状態で作る。
 * 紙面の複製は読み上げ・フォーカスの対象から外す (本文は原稿と印刷対象が担う)
 */
function buildWindowClone(doc: RenderedDocument, segment: PageSegment, column: number): HTMLElement {
  const mc = buildSegmentClone(doc, segment.start, segment.end);
  mc.style.marginLeft = `${-(column * COLUMN_STEP_MM)}mm`;
  mc.setAttribute('inert', '');
  return mc;
}
