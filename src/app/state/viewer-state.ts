import { Service, computed, inject } from '@angular/core';
import { measurePagination } from '../pagination/page-count';
import { EditorStore } from './editor-store';
import { Zoom } from './zoom';

/**
 * 紙面ビューの表示状態。操作 UI (ヘッダ) と描画 (プレビュー) が離れているため
 * サービスとして共有する
 */
@Service()
export class ViewerState {
  private readonly store = inject(EditorStore);

  readonly zoom = new Zoom();

  /**
   * ページ組。(doc, breaks) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測はプローブで行うが観測可能な状態を残さない)
   */
  readonly pagination = computed(() => {
    const doc = this.store.renderedDocument();
    return doc === null ? null : measurePagination(doc, this.store.breaks());
  });

  readonly pageCount = computed(() => this.pagination()?.total ?? 0);
}
