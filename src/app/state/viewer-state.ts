import { Service, computed, inject, signal } from '@angular/core';
import { measurePageCount } from '../page-count';
import { EditorStore } from './editor-store';

export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * 紙面ビューの表示状態。操作 UI (ヘッダ) と描画 (プレビュー) が離れているため
 * サービスとして共有する。100% = A4 実寸
 */
@Service()
export class ViewerState {
  private readonly store = inject(EditorStore);

  readonly zoomIndex = signal(2);
  readonly zoom = computed(() => ZOOMS[this.zoomIndex()]);
  readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  /**
   * ページ数。(doc, breaks) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測はプローブで行うが観測可能な状態を残さない)
   */
  readonly pageCount = computed(() => {
    const doc = this.store.renderedDocument();
    if (doc === null) return 0;
    return measurePageCount(doc, this.store.breaks());
  });

  setZoom(delta: -1 | 1): void {
    this.zoomIndex.update((i) => Math.min(ZOOMS.length - 1, Math.max(0, i + delta)));
  }
}
