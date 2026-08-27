import { Component, inject } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { FontSizeControlViewModel } from './font-size-control.vm';

/**
 * 本文のベース文字サイズの段送り操作面。
 * 読み上げの名前に現在値を含めるのは、値を出す span がどのボタンの名前にも
 * aria-live の領域にも属さないためである
 */
@Component({
  selector: 'app-font-size-control',
  imports: [ToolbarWidget],
  providers: [FontSizeControlViewModel],
  host: { class: 'contents' },
  template: `
    <span>文字</span>
    <button
      class="rounded px-2 py-0.5 aria-disabled:text-stone-500"
      ngToolbarWidget
      value="font-size-down"
      [disabled]="!vm.isShrinkable()"
      [attr.aria-label]="'文字 ' + vm.current().label + ' を小さく'"
      (click)="vm.changeBy(-1)"
    >
      −
    </button>
    <span class="w-12 text-center">{{ vm.current().label }}</span>
    <button
      class="rounded px-2 py-0.5 aria-disabled:text-stone-500"
      ngToolbarWidget
      value="font-size-up"
      [disabled]="!vm.isGrowable()"
      [attr.aria-label]="'文字 ' + vm.current().label + ' を大きく'"
      (click)="vm.changeBy(1)"
    >
      ＋
    </button>
  `,
})
export class FontSizeControl {
  protected readonly vm = inject(FontSizeControlViewModel);
}
