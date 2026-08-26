import { Component, computed, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { isActivating, preventToolbarSelection } from './toolbar-activation';

/**
 * 用紙書式を前後のボタンで選ぶ。ネイティブの select は使えない。
 * Toolbar のホストが pointerdown を無条件で preventDefault するため、
 * ツールバーの中に置いた select はポップアップを開かない。
 * 読み上げの名前に現在値を含めるのは、値を出す span がどのボタンの名前にも
 * aria-live の領域にも属さないためである
 */
@Component({
  selector: 'app-paper-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>用紙</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="paper-back"
      [disabled]="!reach().back"
      [attr.aria-label]="'用紙 ' + field().value().label + ' を前へ'"
      (click)="change(-1)"
      (keydown)="onKeydown($event, -1)"
    >
      ◀
    </button>
    <span class="min-w-11 text-center">{{ field().value().label }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      value="paper-forward"
      [disabled]="!reach().forward"
      [attr.aria-label]="'用紙 ' + field().value().label + ' を次へ'"
      (click)="change(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ▶
    </button>
  `,
})
export class PaperControl {
  /** 現在の書式 */
  readonly selected = model.required<PaperFormat>();

  protected readonly field = form(this.selected);

  /** どちら向きへまだ変えられるか */
  protected readonly reach = computed(() => ({
    back: PAPERS.isChangeable(this.field().value(), -1),
    forward: PAPERS.isChangeable(this.field().value(), 1),
  }));

  protected change(delta: -1 | 1): void {
    this.selected.set(PAPERS.next(this.field().value(), delta));
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
