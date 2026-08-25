import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../shared/markdown/block-extractor';
import { Breaks } from '../../shared/pagination/breaks';
import { ConversionPipeline } from '../../shared/conversion-pipeline';

/** PrintRoot のビューモデル。掲示する文書と強制改ページ指定の問い合わせ */
@Injectable()
export class PrintRootViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);

  readonly rendered: Signal<RenderedDocument | null> = this.pipeline.renderedDocument;
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;
}
