import { Component, DestroyRef, effect, inject, viewChild, type ElementRef } from '@angular/core';
import type { RenderedDocument } from '../../../markdown/block-extractor';
import type { PageSegment, Pagination } from '../../../pagination';
import { buildSegmentClone } from '../../../segment-clone';
import { ifDefined } from '../../../collections';
import { EditorStore } from '../../../state/editor-store';
import { ViewerState } from '../../../state/viewer-state';
import { A4 } from '../../../page-geometry';

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
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="viewer.zoom.value()"></div>
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
    this.reset();
    this.populate(doc, pagination);
  }

  private populate(doc: RenderedDocument | null, pagination: Pagination | null): void {
    if (doc !== null && pagination !== null) {
      this.observer = this.createObserver(doc, pagination);
      this.mountAll(doc, pagination);
    }
  }

  private reset(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.sheetsHost().nativeElement.replaceChildren();
  }

  /** 大部数対策: シートは空の枠だけ並べ、可視域に入ったものだけ中身を実体化する */
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
      this.realize(entry.target as HTMLElement, doc, pagination);
      this.observer?.unobserve(entry.target);
    }
  }

  private mountAll(doc: RenderedDocument, pagination: Pagination): void {
    const host = this.sheetsHost().nativeElement;
    const { total } = pagination;
    for (let index = 0; index < total; index++) {
      this.placeSheet(host, index, doc, pagination);
    }
  }

  private placeSheet(
    host: HTMLElement,
    index: number,
    doc: RenderedDocument,
    pagination: Pagination,
  ): void {
    const sheet = createSheet(index);
    host.append(sheet);
    this.settle(sheet, doc, pagination);
  }

  private settle(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    this.watchLazily(sheet);
    this.fillEagerly(sheet, doc, pagination);
  }

  private watchLazily(sheet: HTMLElement): void {
    if (this.observer !== null) {
      this.observer.observe(sheet);
    }
  }

  private fillEagerly(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (this.observer === null) {
      this.realize(sheet, doc, pagination);
    }
  }

  /** シートへ段組クローンの窓を実体化する。実体化済みなら何もしない */
  private realize(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    if (isEmpty(sheet)) {
      this.materialize(sheet, doc, pagination);
    }
  }

  private materialize(sheet: HTMLElement, doc: RenderedDocument, pagination: Pagination): void {
    const index = Number(sheet.dataset['page']) - 1;
    ifDefined(segmentAt(pagination, index), (segment) =>
      sheet.append(clipWindow(doc, segment, columnFor(segment, index))),
    );
  }
}

function isEmpty(sheet: HTMLElement): boolean {
  return sheet.childElementCount === 0;
}

function createSheet(index: number): HTMLElement {
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

function clipWindow(doc: RenderedDocument, segment: PageSegment, column: number): HTMLElement {
  const clip = document.createElement('div');
  clip.className = 'clip';
  clip.append(shiftedClone(doc, segment, column));
  return clip;
}

/**
 * セグメントのクローンを、セグメント内の段位置ぶん左へずらした状態で作る。
 * 紙面の複製は読み上げ・フォーカスの対象から外す (本文は原稿と印刷対象が担う)
 */
function shiftedClone(doc: RenderedDocument, segment: PageSegment, column: number): HTMLElement {
  const mc = buildSegmentClone(doc, segment.start, segment.end);
  mc.style.marginLeft = `${-(column * A4.column.step)}mm`;
  mc.setAttribute('inert', '');
  return mc;
}
