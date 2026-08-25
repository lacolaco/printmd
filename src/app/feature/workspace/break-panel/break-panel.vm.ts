import { Injectable, inject, type Signal } from '@angular/core';
import type { FileGroup } from '../../../shared/markdown/block-groups';
import { Breaks } from '../../../shared/pagination/breaks';
import { Documents } from '../../../shared/documents';

/** BreakPanel のビューモデル。改ページ一覧の問い合わせとトグルの命令 */
@Injectable()
export class BreakPanelViewModel {
  private readonly documents = inject(Documents);
  private readonly breaks = inject(Breaks);

  readonly groups: Signal<readonly FileGroup[]> = this.documents.blockGroups;
  readonly rowTotal: Signal<number> = this.documents.rowTotal;
  readonly multiSource: Signal<boolean> = this.documents.multiSource;
  readonly breakIds: Signal<ReadonlySet<string>> = this.breaks.ids;

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
