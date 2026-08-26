import { Component, input, output } from '@angular/core';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { isActivating, preventToolbarSelection } from './toolbar-activation';

/**
 * 表示倍率を前後のボタンで動かす。表示と可否を受け取り、操作をイベントで返す。
 * 読み上げの名前に現在値を含めるのは、値を出す span がどのボタンの名前にも
 * aria-live の領域にも属さないためである
 */
@Component({
  selector: 'app-zoom-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>倍率</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="zoom-out"
      [disabled]="!isShrinkable()"
      [attr.aria-label]="'倍率 ' + label() + ' を下げる'"
      (click)="shrink.emit()"
      (keydown)="onKeydown($event, shrink)"
    >
      ◀
    </button>
    <span class="min-w-11 text-center">{{ label() }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="zoom-in"
      [disabled]="!isGrowable()"
      [attr.aria-label]="'倍率 ' + label() + ' を上げる'"
      (click)="grow.emit()"
      (keydown)="onKeydown($event, grow)"
    >
      ▶
    </button>
  `,
})
export class ZoomControl {
  readonly label = input('');
  readonly isShrinkable = input(false);
  readonly isGrowable = input(false);
  readonly shrink = output();
  readonly grow = output();

  protected onKeydown(event: KeyboardEvent, action: { emit(): void }): void {
    preventToolbarSelection(event);
    this.emitUnlessRepeat(event, action);
  }

  protected emitUnlessRepeat(event: KeyboardEvent, action: { emit(): void }): void {
    if (isActivating(event)) {
      action.emit();
    }
  }
}
