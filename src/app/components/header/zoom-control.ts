import { Component, inject } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { Editor } from '../editor';
import { ZoomState } from '../../state/zoom.state';

/**
 * ズームの段送り操作。判断は Editor、現在段の表示は ZoomState から読む
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
    <span class="w-10 text-center">{{ zoom.label() }}</span>
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
  protected readonly zoom = inject(ZoomState);
}
