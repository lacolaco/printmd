import { Service, computed, inject, signal } from '@angular/core';
import type { Block, MasterDocument } from '../markdown/block-extractor';
import { buildMaster } from '../markdown/block-extractor';
import { applyMermaidResults } from '../mermaid/apply-mermaid-results';
import { MermaidRenderer } from '../mermaid/mermaid-renderer';
import { renderMarkdown } from '../markdown/render-markdown';

/** 取り込んだ原稿ファイル。content は不変 (原稿は書き換えない) */
export interface ManuscriptFile {
  readonly id: number;
  readonly name: string;
  readonly content: string;
}

export type EditorPhase = 'idle' | 'rendering';

const MARKDOWN_NAME_PATTERN = /\.(md|markdown|txt)$/i;

/**
 * アプリの状態。signals の一方向伝播:
 * 原稿ファイル → markdown-it 変換 → mermaid SVG 化 → マスター HTML 構築 →
 * ブロック一覧。改ページ Set はタブ寿命のみで原稿を書き換えない。
 */
@Service()
export class EditorStore {
  private readonly mermaidRenderer = inject(MermaidRenderer);

  private nextFileId = 1;
  private rebuilding = false;
  private rebuildRequested = false;

  private readonly filesSignal = signal<readonly ManuscriptFile[]>([]);
  private readonly breaksSignal = signal<ReadonlySet<string>>(new Set());
  private readonly phaseSignal = signal<EditorPhase>('idle');
  private readonly masterSignal = signal<MasterDocument | null>(null);
  private readonly importWarningsSignal = signal<readonly string[]>([]);

  readonly files = this.filesSignal.asReadonly();
  readonly breaks = this.breaksSignal.asReadonly();
  readonly phase = this.phaseSignal.asReadonly();
  readonly warnings = this.importWarningsSignal.asReadonly();
  readonly hasFiles = computed(() => this.files().length > 0);
  readonly blocks = computed<readonly Block[]>(() => this.masterSignal()?.blocks ?? []);

  /**
   * 強制改ページ (breaks Set またはファイル境界) のクラスを反映したマスター要素。
   * 印刷用の直接表示とプレビューのクローン元を兼ねる、唯一の DOM 実体
   */
  readonly printableMaster = computed<HTMLElement | null>(() => {
    const master = this.masterSignal();
    if (master === null) return null;
    const breaks = this.breaksSignal();
    [...master.container.children].forEach((el, i) => {
      const block = master.blocks[i];
      el.classList.toggle('forced-break', block.isFileBoundary || breaks.has(block.id));
    });
    return master.container;
  });

  async addFiles(files: readonly { name: string; text(): Promise<string> }[]): Promise<void> {
    const settled = await Promise.allSettled(
      files.map(async (file) => ({
        id: this.nextFileId++,
        name: file.name,
        content: await file.text(),
      })),
    );
    const loaded = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failedNames = files
      .filter((_, i) => settled[i].status === 'rejected')
      .map((f) => f.name);
    const markdownOnly = loaded.filter((f) => MARKDOWN_NAME_PATTERN.test(f.name));
    const warnings: string[] = [];
    if (markdownOnly.length < loaded.length) {
      warnings.push('Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません');
    }
    if (failedNames.length > 0) {
      warnings.push(`読み込めなかったファイル: ${failedNames.join(', ')}`);
    }
    this.importWarningsSignal.set(warnings);
    if (markdownOnly.length > 0) {
      this.filesSignal.update((current) => [...current, ...markdownOnly]);
    }
    await this.rebuild();
  }

  removeFile(id: number): void {
    const before = this.filesSignal();
    this.filesSignal.update((current) => current.filter((f) => f.id !== id));
    if (this.filesSignal() !== before) this.resetBreaks();
    void this.rebuild();
  }

  /** ファイルを 1 つ上/下へ動かす。実際に動いたら true (呼び出し側の告知・フォーカス制御用) */
  moveFile(id: number, delta: -1 | 1): boolean {
    const before = this.filesSignal();
    this.filesSignal.update((current) => {
      const index = current.findIndex((f) => f.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    const changed = this.filesSignal() !== before;
    if (changed) this.resetBreaks();
    void this.rebuild();
    return changed;
  }

  reorderFile(fromIndex: number, toIndex: number): boolean {
    const before = this.filesSignal();
    this.filesSignal.update((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    const changed = this.filesSignal() !== before;
    if (changed) this.resetBreaks();
    void this.rebuild();
    return changed;
  }

  toggleBreak(blockId: string): void {
    this.breaksSignal.update((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }

  private resetBreaks(): void {
    if (this.breaksSignal().size > 0) this.breaksSignal.set(new Set());
  }

  /**
   * 単飛行 + 後追い: 実行中に入力が変わったら、いま投げた構築を積み増さず、
   * 完了後に最新入力でもう 1 回だけ実行する
   */
  private async rebuild(): Promise<void> {
    if (this.rebuilding) {
      this.rebuildRequested = true;
      return;
    }
    this.rebuilding = true;
    try {
      do {
        this.rebuildRequested = false;
        await this.runPipeline();
      } while (this.rebuildRequested);
    } finally {
      this.rebuilding = false;
    }
  }

  private async runPipeline(): Promise<void> {
    const files = this.filesSignal();
    if (files.length === 0) {
      this.masterSignal.set(null);
      this.phaseSignal.set('idle');
      return;
    }
    this.phaseSignal.set('rendering');
    const rendered = files.map((file) => ({ file, ...renderMarkdown(file.content) }));
    const mermaidBlocks = rendered.flatMap((r) => r.mermaidBlocks);
    const results = await this.mermaidRenderer.render(mermaidBlocks);
    const fragments = rendered.map((r, fileIndex) => ({
      fileIndex,
      fileName: r.file.name,
      html: applyMermaidResults(r.html, results),
    }));
    this.masterSignal.set(buildMaster(fragments));
    this.phaseSignal.set('idle');
  }
}
