import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { ZOOMS, isAtLimit, stepped } from '../../shared/pagination/zoom';
import { isActivating, preventSelection } from './toolbar-activation';

/** 表示倍率の段送り操作面。段を Signal Forms のフィールドで保持し、ボタンはその値を書き換える */
@Component({
  selector: 'app-zoom-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>倍率</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="zoom-out"
      [disabled]="!isShrinkable()"
      aria-label="縮小"
      (click)="step(-1)"
      (keydown)="onKeydown($event, -1)"
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
      (click)="step(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ＋
    </button>
  `,
})
export class ZoomControl {
  /** 現在の段 (ZOOMS の添字) */
  readonly selected = model.required<number>();

  protected readonly field = form(this.selected);
  protected readonly label = computed(() => `${Math.round(ZOOMS[this.selected()] * 100)}%`);
  protected readonly isShrinkable = computed(() => !isAtLimit(this.selected(), -1));
  protected readonly isGrowable = computed(() => !isAtLimit(this.selected(), 1));

  protected step(delta: -1 | 1): void {
    this.field().value.set(stepped(this.selected(), delta));
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
