import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { isActivating, preventSelection } from './toolbar-activation';

/**
 * 用紙書式の段送り操作面。段を Signal Forms のフィールドで保持し、ボタンはその値を書き換える。
 * native の select は使えない。Toolbar のホストが pointerdown を無条件で
 * preventDefault するため、帯の中に置いた select は開かなくなる
 */
@Component({
  selector: 'app-paper-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>用紙</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="paper-prev"
      [disabled]="!reach().back"
      aria-label="前の用紙"
      (click)="step(-1)"
      (keydown)="onKeydown($event, -1)"
    >
      −
    </button>
    <span class="w-10 text-center">{{ selected().label }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:opacity-30"
      ngToolbarWidget
      value="paper-next"
      [disabled]="!reach().forward"
      aria-label="次の用紙"
      (click)="step(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ＋
    </button>
  `,
})
export class PaperControl {
  /** 現在の書式 */
  readonly selected = model.required<PaperFormat>();

  protected readonly field = form(this.selected);
  /** どちら向きへまだ段を送れるか */
  protected readonly reach = computed(() => ({
    back: PAPERS.isSteppable(this.selected(), -1),
    forward: PAPERS.isSteppable(this.selected(), 1),
  }));

  protected step(delta: -1 | 1): void {
    this.field().value.set(PAPERS.next(this.selected(), delta));
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
