import { Component, computed, inject } from '@angular/core';
import { Editor } from '../editor';

/**
 * 頁数の表示。変換中・空文書・頁数の 3 状態を 1 つの読み上げ対象文言に畳む
 */
@Component({
  selector: 'app-page-status',
  host: { class: 'contents' },
  template: `<span role="status" aria-live="polite">{{ label() }}</span>`,
})
export class PageStatus {
  private readonly editor = inject(Editor);

  protected readonly label = computed(() => {
    const count = this.editor.pageCount();
    return this.editor.isRendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });
}
