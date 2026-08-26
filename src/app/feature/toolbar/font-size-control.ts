import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { isSteppable, steppedFrom } from '../../shared/typography/font-catalog';
import type { FontSize } from '../../shared/typography/font-size';
import { isActivating, preventSelection } from './toolbar-activation';

/** 本文のベース文字サイズの段送り操作面。段を Signal Forms のフィールドで保持し、ボタンはその値を書き換える */
@Component({
  selector: 'app-font-size-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>文字</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="font-size-down"
      [disabled]="!isShrinkable()"
      aria-label="文字を縮小"
      (click)="step(-1)"
      (keydown)="onKeydown($event, -1)"
    >
      −
    </button>
    <span class="w-11 text-center">{{ selected().label }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="font-size-up"
      [disabled]="!isGrowable()"
      aria-label="文字を拡大"
      (click)="step(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ＋
    </button>
  `,
})
export class FontSizeControl {
  /** 現在の段 */
  readonly selected = model.required<FontSize>();

  protected readonly field = form(this.selected);
  protected readonly isShrinkable = computed(() => isSteppable(this.selected(), -1));
  protected readonly isGrowable = computed(() => isSteppable(this.selected(), 1));

  protected step(delta: -1 | 1): void {
    this.field().value.set(steppedFrom(this.selected(), delta));
  }

  protected onKeydown(event: KeyboardEvent, delta: -1 | 1): void {
    preventSelection(event);
    this.stepIfActivating(event, delta);
  }

  protected stepIfActivating(event: KeyboardEvent, delta: -1 | 1): void {
    if (isActivating(event)) {
      this.step(delta);
    }
  }
}
