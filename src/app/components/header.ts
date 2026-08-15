import { Component, computed, inject } from '@angular/core';
import { EditorStore } from '../state/editor-store';
import { ViewerState, ZOOMS } from '../state/viewer-state';

/**
 * アプリヘッダ。ロゴ / 表示状態 (頁数・ズーム) / 印刷の終端動作を持つ 1 本の帯
 */
@Component({
  selector: 'app-header',
  template: `
    <header class="app-header flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (store.hasFiles()) {
        <div
          class="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-stone-700"
          role="toolbar"
          aria-label="表示操作"
        >
          <span role="status" aria-live="polite">{{ statusLabel() }}</span>
          <span aria-hidden="true" class="opacity-40">|</span>
          <button
            type="button"
            class="rounded px-2 py-0.5 hover:bg-stone-200 disabled:opacity-30"
            [disabled]="viewer.zoomIndex() === 0"
            aria-label="縮小"
            (click)="viewer.setZoom(-1)"
          >
            −
          </button>
          <span class="w-10 text-center">{{ viewer.zoomLabel() }}</span>
          <button
            type="button"
            class="rounded px-2 py-0.5 hover:bg-stone-200 disabled:opacity-30"
            [disabled]="viewer.zoomIndex() === maxZoomIndex"
            aria-label="拡大"
            (click)="viewer.setZoom(1)"
          >
            ＋
          </button>
        </div>
      }
      <button
        type="button"
        class="app-print-button ml-auto rounded-sm px-3 py-1 text-xs font-medium"
        (click)="print()"
      >
        印刷 (PDFに保存)
      </button>
    </header>
  `,
})
export class Header {
  protected readonly store = inject(EditorStore);
  protected readonly viewer = inject(ViewerState);
  protected readonly maxZoomIndex = ZOOMS.length - 1;

  protected readonly statusLabel = computed(() => {
    if (this.store.phase() === 'rendering') return '変換中…';
    const count = this.viewer.pageCount();
    return count === 0 ? '—' : `${count}ページ`;
  });

  protected print(): void {
    window.print();
  }
}
