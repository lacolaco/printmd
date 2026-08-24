import { Injectable, inject } from '@angular/core';
import { Breaks } from '../pagination/breaks';
import { Document } from '../document';

/** PrintRoot のビューモデル。掲示する文書と強制改ページ指定の問い合わせ */
@Injectable()
export class PrintRootViewModel {
  private readonly document = inject(Document);
  private readonly breaks = inject(Breaks);

  readonly rendered = this.document.renderedDocument;
  readonly marked = this.breaks.ids;
}
