import { Service, inject } from '@angular/core';
import { FragmentCache } from './fragment-cache';
import type { ManuscriptFile } from './manuscript';
import { buildRenderedDocument, type RenderedDocument } from './markdown/block-extractor';
import { renderMarkdown, type MermaidBlock } from './markdown/render-markdown';
import { applyMermaidResults } from './mermaid/apply-mermaid-results';
import { MermaidRenderer, type MermaidOutcome } from './mermaid/mermaid-renderer';

function collectMermaidBlocks(
  rendered: readonly { mermaidBlocks: readonly MermaidBlock[] }[],
): readonly MermaidBlock[] {
  return rendered.flatMap((r) => r.mermaidBlocks);
}

/**
 * 変換パイプライン: 原稿ファイル → markdown-it 変換 → mermaid SVG 化 →
 * マスター HTML 構築。断片キャッシュにより並べ替え・削除では再変換しない
 */
@Service()
export class Converter {
  private readonly mermaid = inject(MermaidRenderer);
  private readonly cache = new FragmentCache();

  async render(files: readonly ManuscriptFile[]): Promise<RenderedDocument> {
    const epoch = this.cache.begin();
    await this.convertMissing(files);
    this.evictStale(epoch, files);
    return this.assembleFromCache(files);
  }

  private async convertMissing(files: readonly ManuscriptFile[]): Promise<void> {
    const toRender = files.filter((file) => !this.cache.isCached(file.content));
    const rendered = toRender.map((file) => ({ file, ...renderMarkdown(file.content) }));
    const results = await this.mermaid.render(collectMermaidBlocks(rendered));
    this.storeFragments(rendered, results);
  }

  private storeFragments(
    rendered: readonly { file: ManuscriptFile; html: string }[],
    results: ReadonlyMap<string, MermaidOutcome>,
  ): void {
    for (const r of rendered) {
      this.cache.put(r.file.content, applyMermaidResults(r.html, results));
    }
  }

  private evictStale(epoch: number, files: readonly ManuscriptFile[]): void {
    this.cache.evict(epoch, new Set(files.map((file) => file.content)));
  }

  private assembleFromCache(files: readonly ManuscriptFile[]): RenderedDocument {
    return buildRenderedDocument(files.map((file, index) => this.cache.fragmentFor(file, index)));
  }
}
