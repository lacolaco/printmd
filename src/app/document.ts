import { Service, computed, inject, resource } from '@angular/core';
import { isNonEmpty } from './collections';
import { Converter } from './manuscript/converter';
import { Manuscripts } from './manuscript/manuscripts';
import type { Block, RenderedDocument } from './markdown/block-extractor';
import { groupBlocks } from './markdown/block-groups';
import { measurePagination } from './pagination/page-count';
import { Breaks } from './pagination/breaks';

/** 変換済み文書。変換パイプラインと、文書の導出・ページ組を担う */
@Service()
export class Document {
  private readonly manuscripts = inject(Manuscripts);
  private readonly breaks = inject(Breaks);
  private readonly converter = inject(Converter);

  /**
   * 変換パイプライン。原稿列からの async 導出そのものなので resource で
   * 宣言する (再実行・進行状態・最新入力への追随は resource が担う)。
   * mermaid の SVG 化は中断できないため abortSignal は使わず、破棄された実行の
   * 結果は resource 側が捨てる
   */
  private readonly pipeline = resource({
    params: () => this.manuscripts.files(),
    loader: async ({ params: files }) => (isNonEmpty(files) ? this.converter.render(files) : null),
  });

  readonly rendering = this.pipeline.isLoading;

  /**
   * container は唯一の DOM 実体で、印刷対象 (Printer) がそのまま掲示し、
   * プレビューは複製して使う。強制改ページのクラス付与はここでは行わない
   * (消費者が描画時に applyForcedBreaks を適用する)
   */
  readonly renderedDocument = computed<RenderedDocument | null>(() =>
    this.pipeline.hasValue() ? (this.pipeline.value() ?? null) : null,
  );

  readonly blocks = computed<readonly Block[]>(() => this.renderedDocument()?.blocks ?? []);
  /** ファイルごとのブロック行 (階層深さ付き) */
  readonly blockGroups = computed(() => groupBlocks(this.blocks()));
  readonly rowTotal = computed(() =>
    this.blockGroups().reduce((sum, group) => sum + group.rows.length, 0),
  );
  readonly multiSource = computed(() => new Set(this.blocks().map((b) => b.fileIndex)).size > 1);

  /**
   * ページ組。(doc, breaks) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測はプローブで行うが観測可能な状態を残さない)
   */
  readonly pagination = computed(() => {
    const doc = this.renderedDocument();
    return doc === null ? null : measurePagination(doc, this.breaks.ids());
  });

  readonly pageCount = computed(() => this.pagination()?.total ?? 0);
}
