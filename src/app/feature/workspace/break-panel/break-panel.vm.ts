import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Breaks } from '../../../shared/pagination/breaks';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import type { FileGroup } from '../../../shared/markdown/block-groups';

/** BreakPanel のビューモデル。改ページ一覧の query とトグルの command */
@Injectable()
export class BreakPanelViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);

  /** ファイルごとのブロック行 (階層深さ付き) */
  readonly groups: Signal<readonly FileGroup[]> = computed(
    () => this.pipeline.renderedDocument()?.groups() ?? [],
  );
  /** 一覧の総行数。0 なら調整できるブロックが無い */
  readonly rowTotal: Signal<number> = computed(
    () => this.pipeline.renderedDocument()?.rowTotal() ?? 0,
  );
  /** 複数ファイル由来か。行のグループ見出しを出すかの判断 */
  readonly isMultiSource: Signal<boolean> = computed(
    () => this.pipeline.renderedDocument()?.isMultiSource() ?? false,
  );
  /** 強制改ページに指定されたブロック ID の集合 */
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  /** 指定ブロックの直前で改ページするかを反転する */
  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
