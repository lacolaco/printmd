import { Service } from '@angular/core';
import { isNonEmpty } from '../collections';
import type { MermaidBlock } from '../markdown/render-markdown';

export type MermaidOutcome =
  { readonly svg: string } | { readonly failed: true; readonly code: string };

/** テストで差し替えられるよう、必要な表面だけを切り出した mermaid の型 */
export interface MermaidLike {
  initialize(config: object): void;
  render(id: string, code: string): Promise<{ svg: string }>;
}

const INIT_CONFIG = {
  startOnLoad: false,
  // 既定値だが、安全性が既定に依存していることを明示する
  securityLevel: 'strict',
  htmlLabels: false,
  flowchart: { htmlLabels: false },
} as const;

function configure(mermaid: MermaidLike): MermaidLike {
  mermaid.initialize(INIT_CONFIG);
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
  private sequence = 0;

  protected loadModule(): Promise<MermaidLike> {
    return import('mermaid').then((mod) => configure(mod.default));
  }

  private load(): Promise<MermaidLike> {
    this.module ??= this.loadModule();
    return this.module;
  }

  async render(blocks: readonly MermaidBlock[]): Promise<ReadonlyMap<string, MermaidOutcome>> {
    return isNonEmpty(blocks) ? this.produceOutcomes(blocks) : new Map();
  }

  private async produceOutcomes(
    blocks: readonly MermaidBlock[],
  ): Promise<ReadonlyMap<string, MermaidOutcome>> {
    const mermaid = await this.load();
    const run = this.sequence++;
    return this.collectAll(mermaid, run, blocks);
  }

  private async collectAll(
    mermaid: MermaidLike,
    run: number,
    blocks: readonly MermaidBlock[],
  ): Promise<ReadonlyMap<string, MermaidOutcome>> {
    const results = new Map<string, MermaidOutcome>();
    for (let i = 0; i < blocks.length; i++) {
      await this.settleOne(mermaid, run, i, blocks[i], results);
    }
    return results;
  }

  /** mermaid は render 失敗時に一時要素を body へ残す (エラー図が画面に出る)。必ず掃除する */
  private async settleOne(
    mermaid: MermaidLike,
    run: number,
    index: number,
    block: MermaidBlock,
    results: Map<string, MermaidOutcome>,
  ): Promise<void> {
    const elementId = `printmd-mermaid-render-${run}-${index}`;
    results.set(block.id, await this.tryRender(mermaid, elementId, block.code));
    document.getElementById(elementId)?.remove();
    document.getElementById(`d${elementId}`)?.remove();
  }

  private async tryRender(
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
