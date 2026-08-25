import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../shared/markdown/block-extractor';
import { Breaks } from '../../shared/pagination/breaks';
import { Document } from '../../shared/document';

/** PrintRoot のビューモデル。掲示する文書と強制改ページ指定の問い合わせ */
@Injectable()
export class PrintRootViewModel {
  private readonly document = inject(Document);
  private readonly breaks = inject(Breaks);

  readonly rendered: Signal<RenderedDocument | null> = this.document.renderedDocument;
  readonly marked: Signal<ReadonlySet<string>> = this.breaks.ids;
}
