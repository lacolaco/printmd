import { Service, computed, inject, signal } from '@angular/core';
import { MM_TO_PX, PAGE_WIDTH_MM } from '../page-geometry';
import { measurePagination } from '../page-count';
import { EditorStore } from './editor-store';

export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** md ブレークポイント以上で右カラム (調整パネル) が占める幅 */
const PANEL_WIDTH_PX = 360;
/** 紙面の左右に確保する余白ぶん */
const GUTTER_PX = 48;

function indexOfLargestZoomAtMost(fit: number): number {
  let index = 0;
  ZOOMS.forEach((zoom, i) => {
    if (zoom <= fit) {
      index = i;
    }
  });
  return index;
}

/**
 * 初期ズーム段の決定。利用可能幅に A4 紙面が収まる最大の段を選ぶ。
 * 100% (実寸 = 印刷判断の基準) を上限とし、自動では拡大しない
 */
export function defaultZoomIndex(viewportWidth: number, hasSideColumn: boolean): number {
  const available = viewportWidth - (hasSideColumn ? PANEL_WIDTH_PX : 0) - GUTTER_PX;
  const fit = Math.min(1, available / (PAGE_WIDTH_MM * MM_TO_PX));
  return indexOfLargestZoomAtMost(fit);
}

/**
 * 紙面ビューの表示状態。操作 UI (ヘッダ) と描画 (プレビュー) が離れているため
 * サービスとして共有する。100% = A4 実寸
 */
/** matchMedia を持たない環境 (jsdom) では実寸を既定にする */
function initialZoomIndex(): number {
  return typeof window.matchMedia !== 'function'
    ? ZOOMS.indexOf(1)
    : defaultZoomIndex(window.innerWidth, window.matchMedia('(min-width: 768px)').matches);
}

@Service()
export class ViewerState {
  private readonly store = inject(EditorStore);

  readonly zoomIndex = signal(initialZoomIndex());
  readonly zoom = computed(() => ZOOMS[this.zoomIndex()]);
  readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  /**
   * ページ組。(doc, breaks) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測はプローブで行うが観測可能な状態を残さない)
   */
  readonly pagination = computed(() => {
    const doc = this.store.renderedDocument();
    return doc === null ? null : measurePagination(doc, this.store.breaks());
  });

  readonly pageCount = computed(() => this.pagination()?.total ?? 0);

  zoomBy(delta: -1 | 1): void {
    this.zoomIndex.update((i) => Math.min(ZOOMS.length - 1, Math.max(0, i + delta)));
  }
}
