import { Component, computed, inject } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';
import { DocumentState } from '../state/document-state';
import { ManuscriptState } from '../state/manuscript-state';
import { ViewerState } from '../state/viewer-state';

/**
 * アプリヘッダ。ロゴ / 表示状態 (頁数・ズーム) / 印刷の終端動作を持つ 1 本の帯
 */
@Component({
  selector: 'app-header',
  imports: [Toolbar, ToolbarWidget],
  template: `
    <header class="app-header flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (store.nonEmpty()) {
        <div
          class="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-stone-700"
          ngToolbar
          aria-label="表示操作"
        >
          <span role="status" aria-live="polite">{{ statusLabel() }}</span>
          <span aria-hidden="true" class="opacity-40">|</span>
          <button
            class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
            ngToolbarWidget
            value="zoom-out"
            [disabled]="viewer.zoom.isAtLimit(-1)"
            aria-label="縮小"
            (click)="viewer.zoom.by(-1)"
          >
            −
          </button>
          <span class="w-10 text-center">{{ viewer.zoom.label() }}</span>
          <button
            class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
            ngToolbarWidget
            value="zoom-in"
            [disabled]="viewer.zoom.isAtLimit(1)"
            aria-label="拡大"
            (click)="viewer.zoom.by(1)"
          >
            ＋
          </button>
        </div>
      }
      @if (store.nonEmpty()) {
        <button
          type="button"
          class="app-print-button ml-auto rounded-sm px-3 py-1 text-xs font-medium"
          (click)="print()"
        >
          印刷 (PDFに保存)
        </button>
      }
    </header>
  `,
})
export class Header {
  protected readonly store = inject(ManuscriptState);
  protected readonly documents = inject(DocumentState);
  protected readonly viewer = inject(ViewerState);

  protected readonly statusLabel = computed(() => {
    const count = this.viewer.pageCount();
    return this.documents.rendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });

  protected print(): void {
    window.print();
  }
}
