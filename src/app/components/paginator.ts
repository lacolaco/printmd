import { Service, computed, inject } from '@angular/core';
import { measurePagination } from '../pagination/page-count';
import { BreakState } from '../state/break.state';
import { DocumentState } from '../state/document.state';

/** ページ組の導出。操作 UI (ヘッダ) と描画 (プレビュー) が離れているため共有する */
@Service()
export class Paginator {
  private readonly documents = inject(DocumentState);
  private readonly breaks = inject(BreakState);

  /**
   * ページ組。(doc, breaks) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測はプローブで行うが観測可能な状態を残さない)
   */
  readonly pagination = computed(() => {
    const doc = this.documents.renderedDocument();
    return doc === null ? null : measurePagination(doc, this.breaks.ids());
  });

  readonly pageCount = computed(() => this.pagination()?.total ?? 0);
}
