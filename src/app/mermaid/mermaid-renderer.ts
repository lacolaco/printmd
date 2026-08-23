import { Service } from '@angular/core';
import { hasItems } from '../collections';
import type { MermaidBlock } from '../markdown/render-markdown';

export type MermaidOutcome = { readonly svg: string } | { readonly failed: true; readonly code: string };

/** テストで差し替えられるよう、必要な表面だけを切り出した mermaid の型 */
export interface MermaidLike {
  initialize(config: object): void;
  render(id: string, code: string): Promise<{ svg: string }>;
}

const MERMAID_INIT_CONFIG = {
  startOnLoad: false,
  // 既定値だが、安全性が既定に依存していることを明示する
  securityLevel: 'strict',
  htmlLabels: false,
  flowchart: { htmlLabels: false },
} as const;

function initializeMermaid(mermaid: MermaidLike): MermaidLike {
  mermaid.initialize(MERMAID_INIT_CONFIG);
  return mermaid;
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
    return import('mermaid').then((mod) => initializeMermaid(mod.default));
  }

  private load(): Promise<MermaidLike> {
    this.module ??= this.loadModule();
    return this.module;
  }

  async render(blocks: readonly MermaidBlock[]): Promise<ReadonlyMap<string, MermaidOutcome>> {
    if (!hasItems(blocks)) return new Map();
    const mermaid = await this.load();
    const runId = this.renderSeq++;
    return this.renderAll(mermaid, runId, blocks);
  }

  private async renderAll(
    mermaid: MermaidLike,
    runId: number,
    blocks: readonly MermaidBlock[],
  ): Promise<ReadonlyMap<string, MermaidOutcome>> {
    const results = new Map<string, MermaidOutcome>();
    for (let i = 0; i < blocks.length; i++) {
      await this.renderOne(mermaid, runId, i, blocks[i], results);
    }
    return results;
  }

  /** mermaid は render 失敗時に一時要素を body へ残す (エラー図が画面に出る)。必ず掃除する */
  private async renderOne(
    mermaid: MermaidLike,
    runId: number,
    index: number,
    block: MermaidBlock,
    results: Map<string, MermaidOutcome>,
  ): Promise<void> {
    const elementId = `printmd-mermaid-render-${runId}-${index}`;
    results.set(block.id, await this.renderMermaidBlock(mermaid, elementId, block.code));
    document.getElementById(elementId)?.remove();
    document.getElementById(`d${elementId}`)?.remove();
  }

  private async renderMermaidBlock(
    mermaid: MermaidLike,
    elementId: string,
    code: string,
  ): Promise<MermaidOutcome> {
    try {
      return { svg: (await mermaid.render(elementId, code)).svg };
    } catch {
      return { failed: true, code };
    }
  }
}
