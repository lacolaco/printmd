import { Component, DestroyRef, effect, inject, viewChild, type ElementRef } from '@angular/core';
import { PreviewViewModel } from './preview.vm';
import type { PaperFormat } from '../../../shared/paper/paper-format';
import { SheetRenderer } from './sheet-renderer';

/**
 * プレビュー: CSS 多段組を流用したページ分割。変換済み文書の要素を版面幅の
 * 多段組コンテナへ複製し、段 i だけを見せる窓 (版面寸法, overflow hidden) を
 * 用紙書式のシートとして縦に積む。
 * 改ページの指定は右カラムの調整パネルが担い、紙面は表示専用
 */
@Component({
  selector: 'app-preview',
  providers: [PreviewViewModel],
  template: `
    <div class="relative flex h-full min-h-0 flex-col">
      <div
        class="app-workspace min-h-0 flex-1 overflow-auto py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-700"
        tabindex="0"
        role="region"
        aria-label="紙面 (矢印キーでスクロール。各ページのブロック境界に改ページ指定ボタンがあります)"
      >
        <div class="mx-auto w-fit" #sheetsHost [style.zoom]="vm.scale()"></div>
      </div>
      <!-- 読み上げは帯の status が担うため、こちらは視覚専用 -->
      @if (vm.isRendering()) {
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
  protected readonly vm = inject(PreviewViewModel);

  private readonly sheetsHost = viewChild.required<ElementRef<HTMLElement>>('sheetsHost');
  private renderer: SheetRenderer | null = null;

  /** ここは DOM 書き込みのみ (計測は pagination の computed が担う)。signal は先に読む (例外時も依存を登録する) */
  private readonly repaint = effect(() => {
    const doc = this.vm.rendered();
    const pagination = this.vm.pagination();
    const format = this.vm.format();
    this.renderer = renewRenderer(this.renderer, this.sheetsHost().nativeElement, format);
    this.renderer.render(doc, pagination);
  });

  constructor() {
    // 張り替え間では最後の observer が残るため、破棄時にも切断する
    inject(DestroyRef).onDestroy(() => this.renderer?.dispose());
  }
}

function renewRenderer(
  previous: SheetRenderer | null,
  host: HTMLElement,
  format: PaperFormat,
): SheetRenderer {
  previous?.dispose();
  return new SheetRenderer(host, format);
}
