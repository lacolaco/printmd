import { Service, computed, signal } from '@angular/core';
import { ZOOMS, startupStep } from '../pagination/zoom';

/** ズーム段の状態。100% = A4 実寸。段送りの判断は持たず、置き換えを受けるだけ */
@Service()
export class ZoomState {
  private readonly step = signal(startupStep());

  readonly index = this.step.asReadonly();
  readonly value = computed(() => ZOOMS[this.index()]);
  readonly label = computed(() => `${Math.round(this.value() * 100)}%`);

  replace(index: number): void {
    this.step.set(index);
  }
}
