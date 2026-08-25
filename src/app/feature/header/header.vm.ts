import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Breaks } from '../../shared/pagination/breaks';
import { ConversionPipeline } from '../../shared/conversion-pipeline';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Zoom } from '../../shared/pagination/zoom';

/** Header のビューモデル。表示操作の可視判断・頁数文言・段送りの問い合わせと命令 */
@Injectable()
export class HeaderViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);
  private readonly zoom = inject(Zoom);

  readonly isActive: Signal<boolean> = this.manuscripts.isNonEmpty;
  readonly zoomLabel: Signal<string> = this.zoom.label;
  readonly isShrinkable: Signal<boolean> = computed(() => this.zoom.isSteppable(-1));
  readonly isGrowable: Signal<boolean> = computed(() => this.zoom.isSteppable(1));

  readonly status: Signal<string> = computed(() => {
    const count = this.breaks.pageCount();
    return this.pipeline.isRendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });

  stepBy(delta: -1 | 1): void {
    this.zoom.stepBy(delta);
  }
}
