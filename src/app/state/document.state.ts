import { Service, computed, inject, resource } from '@angular/core';
import { isNonEmpty } from '../collections';
import { Converter } from '../manuscript/converter';
import type { Block, RenderedDocument } from '../markdown/block-extractor';
import { groupBlocks } from '../markdown/block-groups';
import { ManuscriptState } from './manuscript.state';

/** 変換済み文書とその導出。原稿列から一方向に流れる */
@Service()
export class DocumentState {
  private readonly manuscripts = inject(ManuscriptState);
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
   * container は唯一の DOM 実体で、印刷対象 (PrintRoot) がそのまま掲示し、
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
}
