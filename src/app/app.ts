import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { BreakPanel } from './components/break-panel';
import { FilePanel } from './components/file-panel';
import { Preview } from './components/preview';
import { applyForcedBreaks } from './markdown/block-extractor';
import { EditorStore } from './state/editor-store';
import { ViewerState, ZOOMS } from './state/viewer-state';

@Component({
  selector: 'app-root',
  imports: [BreakPanel, FilePanel, Preview],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(EditorStore);
  protected readonly viewer = inject(ViewerState);
  protected readonly maxZoomIndex = ZOOMS.length - 1;
  protected readonly statusLabel = computed(() => {
    if (this.store.phase() === 'rendering') return '変換中…';
    const count = this.viewer.pageCount();
    return count === 0 ? '—' : `${count}ページ`;
  });
  private readonly printRoot = viewChild.required<ElementRef<HTMLElement>>('printRoot');

  constructor() {
    // 印刷対象は唯一のマスター要素そのもの (クローンしない)。@media print でのみ可視化する。
    // 強制改ページのクラスは描画時にここで反映する。掲示先は不可視でレイアウト読みも
    // ないため、レンダー後へ遅延させる理由はなく素の effect でよい
    effect(() => {
      const master = this.store.master();
      const breaks = this.store.breaks();
      const host = this.printRoot().nativeElement;
      host.replaceChildren();
      if (master !== null) {
        applyForcedBreaks(master.container, master.blocks, breaks);
        host.append(master.container);
      }
    });
  }

  protected print(): void {
    window.print();
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files !== null) void this.store.addFiles([...input.files]);
    input.value = '';
  }

  /** ウィンドウ全体をドロップ先にする (誤ドロップでのページ遷移も防ぐ) */
  protected onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onWindowDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files !== undefined && files.length > 0) void this.store.addFiles([...files]);
  }
}
