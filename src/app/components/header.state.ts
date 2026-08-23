import { Injectable, computed, inject } from '@angular/core';
import { DocumentState } from '../state/document.state';
import { PaginationState } from '../state/pagination.state';

/** Header のローカル状態。表示文言の導出 */
@Injectable()
export class HeaderState {
  private readonly documents = inject(DocumentState);
  private readonly pagination = inject(PaginationState);

  readonly statusLabel = computed(() => {
    const count = this.pagination.pageCount();
    return this.documents.rendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });
}
