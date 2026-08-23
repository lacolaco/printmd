import { Component, DestroyRef, effect, inject, viewChild, type ElementRef } from '@angular/core';
import { EditorStore } from '../../../state/editor-store';
import { ViewerState } from '../../../state/viewer-state';
import { SheetRenderer } from './sheet-renderer';

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
  private renderer: SheetRenderer | null = null;

  /** 計測は pagination (computed) に移っており、ここは DOM 書き込みのみ */
  constructor() {
    effect(() => {
      this.renderer = renewRenderer(this.renderer, this.sheetsHost().nativeElement);
      this.renderer.render(this.store.renderedDocument(), this.viewer.pagination());
    });
    // 張り替え間では最後の observer が残るため、破棄時にも切断する
    inject(DestroyRef).onDestroy(() => this.renderer?.dispose());
  }
}

/** 張り替えでは前のレンダラを破棄してから作り直す */
function renewRenderer(previous: SheetRenderer | null, host: HTMLElement): SheetRenderer {
  previous?.dispose();
  return new SheetRenderer(host);
}
