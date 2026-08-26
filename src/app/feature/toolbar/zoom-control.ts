import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { ZOOMS } from '../../shared/pagination/zoom';
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
      [disabled]="!reach().back"
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
      [disabled]="!reach().forward"
      aria-label="拡大"
      (click)="step(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ＋
    </button>
  `,
})
export class ZoomControl {
  /** 現在の倍率 (1 = 紙の実寸) */
  readonly selected = model.required<number>();

  protected readonly field = form(this.selected);
  protected readonly label = computed(() => `${Math.round(this.selected() * 100)}%`);
  /** どちら向きへまだ段を送れるか */
  protected readonly reach = computed(() => ({
    back: ZOOMS.isSteppable(this.selected(), -1),
    forward: ZOOMS.isSteppable(this.selected(), 1),
  }));

  protected step(delta: -1 | 1): void {
    this.field().value.set(ZOOMS.next(this.selected(), delta));
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
