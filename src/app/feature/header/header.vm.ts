import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Breaks } from '../../shared/pagination/breaks';
import { Conversion } from '../../shared/conversion';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Zoom } from '../../shared/pagination/zoom';

/** Header のビューモデル。表示操作の可視判断・頁数文言・段送りの問い合わせと命令 */
@Injectable()
export class HeaderViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly conversion = inject(Conversion);
  private readonly breaks = inject(Breaks);
  private readonly zoom = inject(Zoom);

  readonly active: Signal<boolean> = this.manuscripts.nonEmpty;
  readonly zoomLabel: Signal<string> = this.zoom.label;
  readonly shrinkable: Signal<boolean> = computed(() => this.zoom.isSteppable(-1));
  readonly growable: Signal<boolean> = computed(() => this.zoom.isSteppable(1));

  readonly status: Signal<string> = computed(() => {
    const count = this.breaks.pageCount();
    return this.conversion.rendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });

  stepBy(delta: -1 | 1): void {
    this.zoom.stepBy(delta);
  }
}
