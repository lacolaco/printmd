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
  /** ファイル並びの構造変更 (削除・並べ替え) の世代。パネル側の表示状態リセットに使う */
  private readonly structureVersionSignal = signal(0);

  readonly files = this.filesSignal.asReadonly();
  readonly breaks = this.breaksSignal.asReadonly();
  readonly phase = this.phaseSignal.asReadonly();
  readonly warnings = this.importWarningsSignal.asReadonly();
  readonly structureVersion = this.structureVersionSignal.asReadonly();
  readonly hasFiles = computed(() => this.files().length > 0);
  readonly blocks = computed<readonly Block[]>(() => this.masterSignal()?.blocks ?? []);

  /**
   * 強制改ページ (breaks Set またはファイル境界) のクラスを反映したマスター要素。
   * 印刷用の直接表示とプレビューのクローン元を兼ねる、唯一の DOM 実体。
   * container は同一参照のまま変異するため、素の要素を返すと computed の等価判定
   * (Object.is) で変更が下流へ伝播しない。毎回新しいラッパを返して伝播を保証する
   */
  readonly printableMaster = computed<{ readonly container: HTMLElement } | null>(() => {
    const master = this.masterSignal();
    if (master === null) return null;
    const breaks = this.breaksSignal();
    [...master.container.children].forEach((el, i) => {
      const block = master.blocks[i];
      el.classList.toggle('forced-break', block.isFileBoundary || breaks.has(block.id));
    });
    return { container: master.container };
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
    this.applyStructuralChange((current) =>
      current.some((f) => f.id === id) ? current.filter((f) => f.id !== id) : current,
    );
  }

  /** ファイルを 1 つ上/下へ動かす。実際に動いたら true (呼び出し側の告知・フォーカス制御用) */
  moveFile(id: number, delta: -1 | 1): boolean {
    const index = this.filesSignal().findIndex((f) => f.id === id);
    return this.reorderFile(index, index + delta);
  }

  reorderFile(fromIndex: number, toIndex: number): boolean {
    return this.applyStructuralChange((current) => {
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
  }

  /**
   * ファイル並びの構造変更 (削除・並べ替え) を 1 か所で扱う。updater が同一参照を
   * 返したら無変更とみなし、改ページ指定のリセットも再構築の要求も行わない
   */
  private applyStructuralChange(
    updater: (current: readonly ManuscriptFile[]) => readonly ManuscriptFile[],
  ): boolean {
    const before = this.filesSignal();
    this.filesSignal.update(updater);
    const changed = this.filesSignal() !== before;
    if (changed) {
      this.resetBreaks();
      this.structureVersionSignal.update((v) => v + 1);
    }
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
