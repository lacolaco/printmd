import { Injectable, inject } from '@angular/core';
import { Breaks } from '../../../../pagination/breaks';
import { Document } from '../../../../document';

/** BreakPanel のビューモデル。改ページ一覧の問い合わせとトグルの命令 */
@Injectable()
export class BreakPanelViewModel {
  private readonly document = inject(Document);
  private readonly breaks = inject(Breaks);

  readonly groups = this.document.blockGroups;
  readonly rowTotal = this.document.rowTotal;
  readonly multiSource = this.document.multiSource;

  isBroken(blockId: string): boolean {
    return this.breaks.ids().has(blockId);
  }

  toggle(blockId: string): void {
    this.breaks.toggle(blockId);
  }
}
