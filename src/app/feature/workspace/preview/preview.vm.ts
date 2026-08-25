import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../../shared/markdown/rendered-document';
import type { Pagination } from '../../../shared/pagination/pagination';
import { Breaks } from '../../../shared/pagination/breaks';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import { Paper } from '../../../shared/paper/paper';
import { Zoom } from '../../../shared/pagination/zoom';
import type { PaperFormat } from '../../../shared/paper/paper-format';

/** Preview のビューモデル。紙面の描画に要る問い合わせを揃える */
@Injectable()
export class PreviewViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);
  private readonly zoom = inject(Zoom);
  private readonly paper = inject(Paper);

  /** 描画する変換済み文書 (プレビューは複製して使う) */
  readonly rendered: Signal<RenderedDocument | null> = this.pipeline.renderedDocument;
  /** ページ組。シート構築の入力 */
  readonly pagination: Signal<Pagination | null> = this.breaks.pagination;
  /** 変換の進行中か。進行表示に使う */
  readonly isRendering: Signal<boolean> = this.pipeline.isRendering;
  /** 現在の用紙書式 */
  readonly format: Signal<PaperFormat> = this.paper.format;
  /** 紙面の表示倍率 (style.zoom) */
  readonly scale: Signal<number> = this.zoom.value;
}
