import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../../shared/markdown/block-extractor';
import type { Pagination } from '../../../shared/pagination/pagination';
import { Breaks } from '../../../shared/pagination/breaks';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import { Zoom } from '../../../shared/pagination/zoom';

/** Preview のビューモデル。紙面の描画に要る問い合わせを揃える */
@Injectable()
export class PreviewViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);
  private readonly zoom = inject(Zoom);

  readonly rendered: Signal<RenderedDocument | null> = this.pipeline.renderedDocument;
  readonly pagination: Signal<Pagination | null> = this.breaks.pagination;
  readonly isRendering: Signal<boolean> = this.pipeline.isRendering;
  readonly scale: Signal<number> = this.zoom.value;
}
