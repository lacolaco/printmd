import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { SIZES } from '../../shared/typography/font-catalog';
import type { FontSize } from '../../shared/typography/font-size';
import { isActivating, preventToolbarSelection } from './toolbar-activation';

/**
 * 本文のベース文字サイズを前後のボタンで選ぶ。
 * 読み上げの名前に現在値を含めるのは、値を出す span がどのボタンの名前にも
 * aria-live の領域にも属さないためである
 */
@Component({
  selector: 'app-font-size-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>文字</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="font-size-down"
      [disabled]="!reach().back"
      [attr.aria-label]="'文字 ' + field().value().label + ' を小さく'"
      (click)="change(-1)"
      (keydown)="onKeydown($event, -1)"
    >
      ◀
    </button>
    <span class="min-w-11 text-center">{{ field().value().label }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="font-size-up"
      [disabled]="!reach().forward"
      [attr.aria-label]="'文字 ' + field().value().label + ' を大きく'"
      (click)="change(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ▶
    </button>
  `,
})
export class FontSizeControl {
  /** 現在の文字サイズ */
  readonly selected = model.required<FontSize>();

  protected readonly field = form(this.selected);

  /** どちら向きへまだ変えられるか */
  protected readonly reach = computed(() => ({
    back: SIZES.isChangeable(this.field().value(), -1),
    forward: SIZES.isChangeable(this.field().value(), 1),
  }));

  protected change(delta: -1 | 1): void {
    this.selected.set(SIZES.next(this.field().value(), delta));
  }

  protected onKeydown(event: KeyboardEvent, delta: -1 | 1): void {
    preventToolbarSelection(event);
    this.applyIfActivating(event, delta);
  }

  protected applyIfActivating(event: KeyboardEvent, delta: -1 | 1): void {
    if (isActivating(event)) {
      this.change(delta);
    }
  }
}
