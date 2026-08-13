import { Service } from '@angular/core';
import type { MermaidBlock } from '../markdown/render-markdown';

export type MermaidOutcome = { readonly svg: string } | { readonly failed: true; readonly code: string };

/** テストで差し替えられるよう、必要な表面だけを切り出した mermaid の型 */
export interface MermaidLike {
  initialize(config: object): void;
  render(id: string, code: string): Promise<{ svg: string }>;
}

/**
 * mermaid コードをメインスレッドで SVG 化する。
 * - mermaid 本体はコードが存在するときだけ動的 import する (遅延読み込み)
 * - `htmlLabels: false` 必須 (foreignObject を使わせない)
 * - 失敗したブロックは元コードを保持して返す (呼び出し側でコードブロック表示に落とす)
 */
@Service()
export class MermaidRenderer {
  private module: Promise<MermaidLike> | null = null;
  private renderSeq = 0;

  protected loadModule(): Promise<MermaidLike> {
    return import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });
      return mermaid;
    });
  }

  private load(): Promise<MermaidLike> {
    this.module ??= this.loadModule();
    return this.module;
  }

  async render(blocks: readonly MermaidBlock[]): Promise<ReadonlyMap<string, MermaidOutcome>> {
    const results = new Map<string, MermaidOutcome>();
    if (blocks.length === 0) return results;
    const mermaid = await this.load();
    const runId = this.renderSeq++;
    for (let i = 0; i < blocks.length; i++) {
      const { id, code } = blocks[i];
      const elementId = `printmd-mermaid-render-${runId}-${i}`;
      try {
        const { svg } = await mermaid.render(elementId, code);
        results.set(id, { svg });
      } catch {
        results.set(id, { failed: true, code });
      } finally {
        // mermaid は render 失敗時に一時要素を body へ残す (エラー図が画面に出る)。必ず掃除する
        document.getElementById(elementId)?.remove();
        document.getElementById(`d${elementId}`)?.remove();
      }
    }
    return results;
  }
}
