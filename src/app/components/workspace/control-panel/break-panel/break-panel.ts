import { Component, inject } from '@angular/core';
import { Editor } from '../../../editor';
import { BreakState } from '../../../../state/break-state';
import { DocumentState } from '../../../../state/document-state';
import { ManuscriptState } from '../../../../state/manuscript-state';
import { BreakRowItem } from './break-row-item';

/**
 * 改ページ調整パネル。原稿の全トップレベルブロックを document 順に列挙し、
 * チェック = そのブロックの直前で改ページ
 */
@Component({
  selector: 'app-break-panel',
  imports: [BreakRowItem],
  template: `
    @if (manuscripts.nonEmpty()) {
      <section class="mt-4" aria-labelledby="break-heading">
        <div class="mb-2 flex items-center justify-between gap-2">
          <h2 id="break-heading" class="text-sm font-bold text-stone-700">改ページ調整</h2>
        </div>
        @if (documents.rowTotal() === 0) {
          <p class="text-xs text-stone-500">改ページを調整できるブロックがありません</p>
        }
        @for (group of documents.blockGroups(); track group.fileIndex) {
          <div role="group" [attr.aria-label]="documents.multiSource() ? group.fileName : null">
            @if (documents.multiSource()) {
              <p class="mt-2 truncate text-xs font-bold text-stone-500">{{ group.fileName }}</p>
            }
            <ul class="space-y-0.5" role="list">
              @for (row of group.rows; track row.block.id) {
                <li>
                  <app-break-row-item
                    [row]="row"
                    [checked]="breaks.ids().has(row.block.id)"
                    (toggled)="editor.toggleBreak(row.block.id)"
                  />
                </li>
              }
            </ul>
          </div>
        }
      </section>
    }
  `,
})
export class BreakPanel {
  protected readonly manuscripts = inject(ManuscriptState);
  protected readonly documents = inject(DocumentState);
  protected readonly breaks = inject(BreakState);
  protected readonly editor = inject(Editor);
}
