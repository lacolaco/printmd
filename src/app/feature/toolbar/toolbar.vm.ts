import { Injectable, computed, inject, type Signal, type WritableSignal } from '@angular/core';
import { Breaks } from '../../shared/pagination/breaks';
import { ConversionPipeline } from '../../shared/conversion-pipeline';
import { Paper } from '../../shared/paper/paper';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { Zoom } from '../../shared/pagination/zoom';
import { Typography } from '../../shared/typography/typography';
import type { FontSize } from '../../shared/typography/font-size';

/** Toolbar のビューモデル。頁数文言・用紙書式・文字サイズ・表示倍率の問い合わせと仲介 */
@Injectable()
export class ToolbarViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);
  private readonly paper = inject(Paper);
  private readonly zoom = inject(Zoom);
  private readonly typography = inject(Typography);

  /** 現在の用紙書式 (双方向。選択はここへ書き戻る) */
  readonly format: WritableSignal<PaperFormat> = this.paper.format;
  /** 現在のベース文字サイズの段 (双方向) */
  readonly fontSize: WritableSignal<FontSize> = this.typography.size;
  /** 現在の表示倍率の段 (双方向。ZOOMS の添字) */
  readonly zoomIndex: WritableSignal<number> = this.zoom.index;

  /** 頁数と変換中を畳んだ読み上げ対象の文言 */
  readonly status: Signal<string> = computed(() => {
    const count = this.breaks.pageCount();
    return this.pipeline.isRendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });
}
