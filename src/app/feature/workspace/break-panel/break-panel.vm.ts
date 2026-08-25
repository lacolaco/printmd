import { Injectable, inject, type Signal } from '@angular/core';
import type { FileGroup } from '../../../shared/markdown/block-groups';
import { Breaks } from '../../../shared/pagination/breaks';
import { Document } from '../../../shared/document';

/** BreakPanel のビューモデル。改ページ一覧の問い合わせとトグルの命令 */
@Injectable()
export class BreakPanelViewModel {
  private readonly document = inject(Document);
  private readonly breaks = inject(Breaks);

  readonly groups: Signal<readonly FileGroup[]> = this.document.blockGroups;
  readonly rowTotal: Signal<number> = this.document.rowTotal;
  readonly multiSource: Signal<boolean> = this.document.multiSource;
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
