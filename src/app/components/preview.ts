import { Component, DestroyRef, effect, inject, viewChild, type ElementRef } from '@angular/core';
import type { RenderedDocument } from '../markdown/block-extractor';
import { buildColumnClone } from '../page-count';
import { EditorStore } from '../state/editor-store';
import { ViewerState } from '../state/viewer-state';
import { COLUMN_STEP_MM } from '../page-geometry';


/**
 * プレビュー: CSS 多段組を流用したページ分割。変換済み文書の要素を段幅 178mm の
 * 多段組コンテナへ複製し、段 i だけを見せる窓 (178mm × 265mm, overflow
 * hidden) を A4 シートとして縦に積む。
 * 改ページの指定は右カラムの調整パネルが担い、紙面は表示専用
 */
@Component({
  selector: 'app-preview',
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <div
        class="app-workspace min-h-0 flex-1 overflow-auto py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-700"
        tabindex="0"
        role="region"
        aria-label="紙面 (矢印キーでスクロール。各ページのブロック境界に改ページ指定ボタンがあります)"
      >
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="viewer.zoom()"></div>
      </div>
    </div>
  `,
})
export class Preview {
  private readonly store = inject(EditorStore);
  protected readonly viewer = inject(ViewerState);

  private readonly sheetsHost = viewChild.required<ElementRef<HTMLElement>>('sheetsHost');

  constructor() {
    // 計測は pageCount (computed) に移っており、ここは DOM 書き込みのみ
    effect(() => {
      this.rebuild(this.store.renderedDocument(), this.store.breaks());
    });
    // rebuild 間の張り替えでは最後の observer が残るため、破棄時に切断する
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  /** 可視シートの遅延実体化に使う。rebuild ごとに張り直す */
  private observer: IntersectionObserver | null = null;

  private rebuild(doc: RenderedDocument | null, breaks: ReadonlySet<string>): void {
    const host = this.sheetsHost().nativeElement;
    this.observer?.disconnect();
    this.observer = null;
    host.replaceChildren();
    if (doc === null) return;
    const count = this.viewer.pageCount();
    // 大部数対策: シートは空の枠だけ並べ、可視域に入ったものだけ中身を実体化する
    const lazy = typeof IntersectionObserver !== 'undefined';
    if (lazy) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.fillSheet(entry.target as HTMLElement, doc, breaks);
            this.observer?.unobserve(entry.target);
          }
        },
        { rootMargin: '600px 0px' },
      );
    }
    for (let index = 0; index < count; index++) {
      const sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.dataset['page'] = String(index + 1);
      host.append(sheet);
      if (lazy) this.observer?.observe(sheet);
      else this.fillSheet(sheet, doc, breaks);
    }
  }

  /** シートへ段組クローンの窓を実体化する。実体化済みなら何もしない */
  private fillSheet(sheet: HTMLElement, doc: RenderedDocument, breaks: ReadonlySet<string>): void {
    if (sheet.childElementCount > 0) return;
    const index = Number(sheet.dataset['page']) - 1;
    const clip = document.createElement('div');
    clip.className = 'clip';
    const mc = buildColumnClone(doc, breaks);
    mc.style.marginLeft = `${-(index * COLUMN_STEP_MM)}mm`;
    // 紙面の複製は読み上げ・フォーカスの対象から外す (本文は原稿と印刷対象が担う)
    mc.setAttribute('inert', '');
    clip.append(mc);
    sheet.append(clip);
  }


}
