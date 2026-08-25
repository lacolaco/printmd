import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../../shared/markdown/block-extractor';
import type { Pagination } from '../../../shared/pagination/pagination';
import { Conversion } from '../../../shared/conversion';
import { Zoom } from '../../../shared/pagination/zoom';

/** Preview のビューモデル。紙面の描画に要る問い合わせを揃える */
@Injectable()
export class PreviewViewModel {
  private readonly conversion = inject(Conversion);
  private readonly zoom = inject(Zoom);

  readonly rendered: Signal<RenderedDocument | null> = this.conversion.renderedDocument;
  readonly pagination: Signal<Pagination | null> = this.conversion.pagination;
  readonly rendering: Signal<boolean> = this.conversion.rendering;
  readonly scale: Signal<number> = this.zoom.value;
}
