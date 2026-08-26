import { Component, input, output, type OutputEmitterRef } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';

/**
 * ズームの段送り操作面。表示と可否を受け取り、操作をイベントで返すだけ。
 * Toolbar は Enter / Space を自前の選択へ割り当てて button の既定動作を止めるため、
 * 段送りはボタン自身の keydown で受ける (段送りは選択ではなくアクションなので、
 * Toolbar の選択模型からは結果を読まない)。長押しの repeat では既定動作が止まらず
 * click が合成されるので、repeat 中は降りて二重発火を避ける
 */
@Component({
  selector: 'app-zoom-control',
  imports: [ToolbarWidget],
  host: { class: 'flex items-center gap-2' },
  template: `
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-out"
      [disabled]="!isShrinkable()"
      aria-label="縮小"
      (click)="shrink.emit()"
      (keydown)="onKeydown($event, shrink)"
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
      (keydown)="onKeydown($event, grow)"
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

  protected onKeydown(event: KeyboardEvent, action: OutputEmitterRef<void>): void {
    if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
      action.emit();
    }
  }
}
