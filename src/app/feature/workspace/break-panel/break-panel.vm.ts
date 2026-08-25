import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Breaks } from '../../../shared/pagination/breaks';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import type { FileGroup } from '../../../shared/markdown/block-groups';

/** BreakPanel のビューモデル。改ページ一覧の query とトグルの command */
@Injectable()
export class BreakPanelViewModel {
  private readonly pipeline = inject(ConversionPipeline);
  private readonly breaks = inject(Breaks);

  readonly groups: Signal<readonly FileGroup[]> = computed(
    () => this.pipeline.renderedDocument()?.groups() ?? [],
  );
  readonly rowTotal: Signal<number> = computed(
    () => this.pipeline.renderedDocument()?.rowTotal() ?? 0,
  );
  readonly isMultiSource: Signal<boolean> = computed(
    () => this.pipeline.renderedDocument()?.isMultiSource() ?? false,
  );
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
