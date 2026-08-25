import { Injectable, computed, inject, type Signal, type WritableSignal } from '@angular/core';
import { Breaks } from '../../shared/pagination/breaks';
import { ConversionPipeline } from '../../shared/conversion-pipeline';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Paper } from '../../shared/paper/paper';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { Zoom } from '../../shared/pagination/zoom';

/** Header のビューモデル。表示操作の可視判断・頁数文言・用紙書式・段送りの問い合わせと命令 */
@Injectable()
export class HeaderViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);
  private readonly zoom = inject(Zoom);
  private readonly paper = inject(Paper);

  /** 表示操作と印刷ボタンを出すか (原稿があるか) */
  readonly isActive: Signal<boolean> = this.manuscripts.isNonEmpty;
  /** 現在の用紙書式 (双方向。選択はここへ書き戻る) */
  readonly format: WritableSignal<PaperFormat> = this.paper.format;
  /** 現在の表示倍率の文言 */
  readonly zoomLabel: Signal<string> = this.zoom.label;
  /** まだ縮小できるか */
  readonly isShrinkable: Signal<boolean> = computed(() => this.zoom.isSteppable(-1));
  /** まだ拡大できるか */
  readonly isGrowable: Signal<boolean> = computed(() => this.zoom.isSteppable(1));

  /** 頁数と変換中を畳んだ読み上げ対象の文言 */
  readonly status: Signal<string> = computed(() => {
    const count = this.breaks.pageCount();
    return this.pipeline.isRendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });

  /** 表示倍率の段を delta ぶん送る */
  stepBy(delta: -1 | 1): void {
    this.zoom.stepBy(delta);
  }
}
