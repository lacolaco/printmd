import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Typography } from '../../shared/typography/typography';

/** FontSizeControl のビューモデル。現在の文字サイズと、変えられる向きの問い合わせと命令 */
@Injectable()
export class FontSizeControlViewModel {
  private readonly typography = inject(Typography);

  /** 現在の文字サイズ */
  readonly current: Signal<number> = this.typography.size.asReadonly();
  /** 画面に出す表示名 */
  readonly label: Signal<string> = computed(() => `${this.current()}pt`);
  /** まだ小さくできるか */
  readonly isShrinkable: Signal<boolean> = computed(() => this.typography.isChangeable(-1));
  /** まだ大きくできるか */
  readonly isGrowable: Signal<boolean> = computed(() => this.typography.isChangeable(1));

  /** delta ぶん隣の文字サイズへ変える */
  changeBy(delta: -1 | 1): void {
    this.typography.changeBy(delta);
  }
}
