import { Injectable, inject, type Signal } from '@angular/core';
import type { RenderedDocument } from '../../shared/markdown/block-extractor';
import { Breaks } from '../../shared/pagination/breaks';
import { ConversionPipeline } from '../../shared/conversion-pipeline';

/** PrintRoot のビューモデル。掲示する文書と強制改ページ指定の問い合わせ */
@Injectable()
export class PrintRootViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);

  /** 掲示する変換済み文書 (唯一の DOM 実体) */
  readonly rendered: Signal<RenderedDocument | null> = this.pipeline.renderedDocument;
  /** 強制改ページに指定されたブロック ID の集合 */
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;
}
