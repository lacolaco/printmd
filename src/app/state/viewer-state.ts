import { Service, computed, signal } from '@angular/core';

export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * 紙面ビューの表示状態。操作 UI (ヘッダ) と描画 (プレビュー) が離れているため
 * サービスとして共有する。100% = A4 実寸
 */
@Service()
export class ViewerState {
  readonly zoomIndex = signal(2);
  readonly zoom = computed(() => ZOOMS[this.zoomIndex()]);
  readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);
  /** プレビューが計測したページ数。原稿がないときは 0 */
  readonly pageCount = signal(0);

  setZoom(delta: -1 | 1): void {
    this.zoomIndex.update((i) => Math.min(ZOOMS.length - 1, Math.max(0, i + delta)));
  }
}
