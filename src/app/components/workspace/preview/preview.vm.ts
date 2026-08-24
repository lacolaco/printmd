import { Injectable, inject } from '@angular/core';
import { Document } from '../../../document';
import { Zoom } from '../../../pagination/zoom';

/** Preview のビューモデル。紙面の描画に要る問い合わせを揃える */
@Injectable()
export class PreviewViewModel {
  private readonly document = inject(Document);
  private readonly zoom = inject(Zoom);

  readonly rendered = this.document.renderedDocument;
  readonly pagination = this.document.pagination;
  readonly rendering = this.document.rendering;
  readonly scale = this.zoom.value;
}
