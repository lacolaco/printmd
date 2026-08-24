import { Component, inject } from '@angular/core';
import { Breaks } from '../../../../pagination/breaks';
import { Document } from '../../../../document';
import { BreakRowItem } from './break-row-item';

/**
 * 改ページ調整パネル。原稿の全トップレベルブロックを document 順に列挙し、
 * チェック = そのブロックの直前で改ページ
 */
@Component({
  selector: 'app-break-panel',
  imports: [BreakRowItem],
  template: `
    <section class="mt-4" aria-labelledby="break-heading">
      <div class="mb-2 flex items-center justify-between gap-2">
        <h2 id="break-heading" class="text-sm font-bold text-stone-700">改ページ調整</h2>
      </div>
      @if (document.rowTotal() === 0) {
        <p class="text-xs text-stone-500">改ページを調整できるブロックがありません</p>
      }
      @for (group of document.blockGroups(); track group.fileIndex) {
        <div role="group" [attr.aria-label]="document.multiSource() ? group.fileName : null">
          @if (document.multiSource()) {
            <p class="mt-2 truncate text-xs font-bold text-stone-500">{{ group.fileName }}</p>
          }
          <ul class="space-y-0.5" role="list">
            @for (row of group.rows; track row.block.id) {
              <li>
                <app-break-row-item
                  [row]="row"
                  [checked]="breaks.ids().has(row.block.id)"
                  (toggled)="breaks.toggle(row.block.id)"
                />
              </li>
            }
          </ul>
        </div>
      }
    </section>
  `,
})
export class BreakPanel {
  protected readonly document = inject(Document);
  protected readonly breaks = inject(Breaks);
}
