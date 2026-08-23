import { Component, inject } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { Zoom } from '../../pagination/zoom';

/**
 * ズームの段送り操作。段の保有と判断は Zoom が担う
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
      [disabled]="!zoom.isSteppable(-1)"
      aria-label="縮小"
      (click)="zoom.stepBy(-1)"
    >
      −
    </button>
    <span class="w-10 text-center">{{ zoom.label() }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-in"
      [disabled]="!zoom.isSteppable(1)"
      aria-label="拡大"
      (click)="zoom.stepBy(1)"
    >
      ＋
    </button>
  `,
})
export class ZoomControl {
  protected readonly zoom = inject(Zoom);
}
