import { Service, computed, inject, resource } from '@angular/core';
import { isNonEmpty } from './support/collections';
import { Converter } from './manuscript/converter';
import { Manuscripts } from './manuscript/manuscripts';
import type { RenderedDocument } from './markdown/rendered-document';

/** 変換。原稿列を変換済み文書へ導くパイプラインとその進行状態を担う */
@Service()
export class ConversionPipeline {
  private readonly manuscripts = inject(Manuscripts);
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

  /** 変換の進行中か。帯とプレビューが進行表示に使う */
  readonly isRendering = this.pipeline.isLoading;

  /**
   * container は唯一の DOM 実体で、印刷対象 (PrintRoot) がそのまま掲示し、
   * プレビューは複製して使う。強制改ページのクラス付与は消費者の描画時に行う
   */
  readonly renderedDocument = computed<RenderedDocument | null>(() =>
    this.pipeline.hasValue() ? (this.pipeline.value() ?? null) : null,
  );
}
