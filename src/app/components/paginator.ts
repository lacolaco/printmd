import { Service, computed, inject } from '@angular/core';
import { measurePagination } from '../pagination/page-count';
import { BreakState } from '../state/break.state';
import { DocumentState } from '../state/document.state';
import { ZoomState } from '../state/zoom.state';

/**
 * 紙面表示の読み口。ページ組の導出と、表示に要る状態の読みを一手に引き受ける
 * (コンポーネントはグローバルステートを注入せず、ここを経由する)
 */
@Service()
export class Paginator {
  private readonly documents = inject(DocumentState);
  private readonly breaks = inject(BreakState);
  private readonly zoom = inject(ZoomState);

  readonly document = computed(() => this.documents.renderedDocument());
  readonly rendering = computed(() => this.documents.rendering());
  readonly groups = computed(() => this.documents.blockGroups());
  readonly rowTotal = computed(() => this.documents.rowTotal());
  readonly multiSource = computed(() => this.documents.multiSource());
  readonly marked = computed(() => this.breaks.ids());
  readonly scale = computed(() => this.zoom.value());
  readonly zoomLabel = computed(() => this.zoom.label());

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
