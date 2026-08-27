import { Injectable, computed, inject, type Signal } from '@angular/core';
import { SIZES } from '../../shared/typography/font-catalog';
import { Typography } from '../../shared/typography/typography';
import type { FontSize } from '../../shared/typography/font-size';

/** FontSizeControl のビューモデル。現在の文字サイズと、変えられる向きの問い合わせと命令 */
@Injectable()
export class FontSizeControlViewModel {
  private readonly typography = inject(Typography);

  /** 現在の文字サイズ */
  readonly current: Signal<FontSize> = this.typography.size.asReadonly();
  /** まだ小さくできるか */
  readonly isShrinkable: Signal<boolean> = computed(() => SIZES.isChangeable(this.current(), -1));
  /** まだ大きくできるか */
  readonly isGrowable: Signal<boolean> = computed(() => SIZES.isChangeable(this.current(), 1));

  /** delta ぶん隣の文字サイズへ変える */
  changeBy(delta: -1 | 1): void {
    this.typography.changeBy(delta);
  }
}
