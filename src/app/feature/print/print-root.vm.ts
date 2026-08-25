import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../shared/markdown/block-extractor';
import { Breaks } from '../../shared/pagination/breaks';
import { Conversion } from '../../shared/conversion';

/** PrintRoot のビューモデル。掲示する文書と強制改ページ指定の問い合わせ */
@Injectable()
export class PrintRootViewModel {
  private readonly conversion = inject(Conversion);
  private readonly breaks = inject(Breaks);

  readonly rendered: Signal<RenderedDocument | null> = this.conversion.renderedDocument;
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;
}
