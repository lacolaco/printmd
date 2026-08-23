import { Component, inject } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { Editor } from '../editor';

/**
 * ズームの段送り操作。判断も現在段の表示も Editor に問い合わせる
 */
@Component({
  selector: 'app-zoom-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-out"
      [disabled]="!editor.isZoomable(-1)"
      aria-label="縮小"
      (click)="editor.zoomBy(-1)"
    >
      −
    </button>
    <span class="w-10 text-center">{{ editor.stepLabel() }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-in"
      [disabled]="!editor.isZoomable(1)"
      aria-label="拡大"
      (click)="editor.zoomBy(1)"
    >
      ＋
    </button>
  `,
})
export class ZoomControl {
  protected readonly editor = inject(Editor);
}
