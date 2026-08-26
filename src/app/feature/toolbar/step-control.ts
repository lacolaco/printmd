import { Component, computed, input, model } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ToolbarWidget } from '@angular/aria/toolbar';
import type { Steps } from '../../shared/support/steps';

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

/**
 * 段送りの操作面。選べるものはどれもこの 1 つで表すので、増やすときに
 * 操作面を書き足さなくて済む。段は Signal Forms のフィールドで保持し、
 * ボタンはその値を書き換える。
 * native の select は使えない。Toolbar のホストが pointerdown を無条件で
 * preventDefault するため、帯の中に置いた select は開かなくなる
 */
@Component({
  selector: 'app-step-control',
  imports: [ToolbarWidget],
  host: { class: 'contents' },
  template: `
    <span>{{ name() }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      [value]="name() + '-back'"
      [disabled]="!reach().back"
      [attr.aria-label]="reading() + 'を前へ'"
      (click)="step(-1)"
      (keydown)="onKeydown($event, -1)"
    >
      ◀
    </button>
    <span class="min-w-11 text-center">{{ steps().nameOf(field().value()) }}</span>
    <button
      class="rounded px-2 py-0.5 hover:bg-stone-200 aria-disabled:text-stone-400"
      ngToolbarWidget
      [value]="name() + '-forward'"
      [disabled]="!reach().forward"
      [attr.aria-label]="reading() + 'を次へ'"
      (click)="step(1)"
      (keydown)="onKeydown($event, 1)"
    >
      ▶
    </button>
  `,
})
export class StepControl<T> {
  /** 現在の段 */
  readonly selected = model.required<T>();
  /** 選べる段の一覧 */
  readonly steps = input.required<Steps<T>>();
  /** 画面に出すこの操作の名前 (読み上げの名前にも使う) */
  readonly name = input.required<string>();

  /** 段を持つフィールド。現在値の読み出しはここを通す */
  protected readonly field = form(this.selected);

  /**
   * 読み上げの名前。現在の段を含めるのは、段を送っても値そのものは
   * 読み上げられないため (値の span は名前にも live 領域にも属さない)
   */
  protected readonly reading = computed(
    () => `${this.name()} ${this.steps().nameOf(this.field().value())}`,
  );

  /** どちら向きへまだ段を送れるか */
  protected readonly reach = computed(() => ({
    back: this.steps().isSteppable(this.field().value(), -1),
    forward: this.steps().isSteppable(this.field().value(), 1),
  }));

  protected step(delta: -1 | 1): void {
    this.selected.set(this.steps().next(this.field().value(), delta));
  }

  /**
   * Toolbar は Enter / Space を自前の選択へ割り当て、widget の button の click を
   * 合成しない。repeat かどうかを問わず既定動作を止めるのは、
   * KeyboardEventManager が ignoreRepeat のため repeat では Toolbar 側の抑止が
   * 働かず click が合成されてしまうからである。長押しは 1 段だけ送る
   */
  protected onKeydown(event: KeyboardEvent, delta: -1 | 1): void {
    if (isActivationKey(event.key)) {
      event.preventDefault();
      this.stepUnlessRepeat(event.repeat, delta);
    }
  }

  protected stepUnlessRepeat(repeat: boolean, delta: -1 | 1): void {
    if (!repeat) {
      this.step(delta);
    }
  }
}
