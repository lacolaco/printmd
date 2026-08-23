import { Component, computed, inject } from '@angular/core';
import { Paginator } from '../paginator';
import { DocumentState } from '../../state/document.state';

/**
 * 頁数の表示。変換中・空文書・頁数の 3 状態を 1 つの読み上げ対象文言に畳む
 */
@Component({
  selector: 'app-page-status',
  host: { class: 'contents' },
  template: `<span role="status" aria-live="polite">{{ label() }}</span>`,
})
export class PageStatus {
  private readonly documents = inject(DocumentState);
  private readonly paginator = inject(Paginator);

  protected readonly label = computed(() => {
    const count = this.paginator.pageCount();
    return this.documents.rendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });
}
