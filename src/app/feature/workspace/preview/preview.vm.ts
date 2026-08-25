import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../../shared/markdown/block-extractor';
import type { Pagination } from '../../../shared/pagination/pagination';
import { Documents } from '../../../shared/documents';
import { Zoom } from '../../../shared/pagination/zoom';

/** Preview のビューモデル。紙面の描画に要る問い合わせを揃える */
@Injectable()
export class PreviewViewModel {
  private readonly documents = inject(Documents);
  private readonly zoom = inject(Zoom);

  readonly rendered: Signal<RenderedDocument | null> = this.documents.renderedDocument;
  readonly pagination: Signal<Pagination | null> = this.documents.pagination;
  readonly rendering: Signal<boolean> = this.documents.rendering;
  readonly scale: Signal<number> = this.zoom.value;
}
