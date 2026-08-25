import { Injectable, computed, inject, type Signal } from '@angular/core';
import { Breaks } from '../../../shared/pagination/breaks';
import { Conversion } from '../../../shared/conversion';
import type { FileGroup } from '../../../shared/markdown/block-groups';

/** BreakPanel のビューモデル。改ページ一覧の query とトグルの command */
@Injectable()
export class BreakPanelViewModel {
  private readonly conversion = inject(Conversion);
  private readonly breaks = inject(Breaks);

  readonly groups: Signal<readonly FileGroup[]> = computed(
    () => this.conversion.renderedDocument()?.groups() ?? [],
  );
  readonly rowTotal: Signal<number> = computed(
    () => this.conversion.renderedDocument()?.rowTotal() ?? 0,
  );
  readonly multiSource: Signal<boolean> = computed(
    () => this.conversion.renderedDocument()?.isMultiSource() ?? false,
  );
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
