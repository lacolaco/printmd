import { Component, input, output } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';

/** ズームの段送り操作面。表示と可否を受け取り、操作をイベントで返すだけ */
@Component({
  selector: 'app-zoom-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-out"
      [disabled]="!isShrinkable()"
      aria-label="縮小"
      (click)="shrink.emit()"
    >
      −
    </button>
    <span class="w-10 text-center">{{ label() }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-in"
      [disabled]="!isGrowable()"
      aria-label="拡大"
      (click)="grow.emit()"
    >
      ＋
    </button>
  `,
})
export class ZoomControl {
  readonly label = input('');
  readonly isShrinkable = input(false);
  readonly isGrowable = input(false);
  readonly shrink = output();
  readonly grow = output();
}
