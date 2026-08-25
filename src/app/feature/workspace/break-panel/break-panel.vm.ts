import { Injectable, inject, type Signal } from '@angular/core';
import type { FileGroup } from '../../../shared/markdown/block-groups';
import { Breaks } from '../../../shared/pagination/breaks';
import { Conversion } from '../../../shared/conversion';

/** BreakPanel のビューモデル。改ページ一覧の問い合わせとトグルの命令 */
@Injectable()
export class BreakPanelViewModel {
  private readonly conversion = inject(Conversion);
  private readonly breaks = inject(Breaks);

  readonly groups: Signal<readonly FileGroup[]> = this.conversion.blockGroups;
  readonly rowTotal: Signal<number> = this.conversion.rowTotal;
  readonly multiSource: Signal<boolean> = this.conversion.multiSource;
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
