import { Service, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import type { Block, RenderedDocument } from '../markdown/block-extractor';
import { buildRenderedDocument } from '../markdown/block-extractor';
import { applyMermaidResults } from '../mermaid/apply-mermaid-results';
import { isNonEmpty } from '../collections';
import { groupBlocks } from './block-groups';
import { MermaidRenderer, type MermaidOutcome } from '../mermaid/mermaid-renderer';
import { renderMarkdown, type MermaidBlock } from '../markdown/render-markdown';
import { FileOrder } from './file-order';
import { FragmentCache } from './fragment-cache';

/** 取り込んだ原稿ファイル。content は不変 (原稿は書き換えない) */
export interface ManuscriptFile {
  readonly id: number;
  readonly name: string;
  readonly content: string;
}

const MARKDOWN_NAME_PATTERN = /\.(md|markdown|txt)$/i;

/**
 * アプリの状態。signals の一方向伝播:
 * 原稿ファイル → markdown-it 変換 → mermaid SVG 化 → マスター HTML 構築 →
 * ブロック一覧。改ページ Set はタブ寿命のみで原稿を書き換えない。
 */
@Service()
export class EditorStore {
  private readonly mermaidRenderer = inject(MermaidRenderer);

  private serial = 1;
  /** 並べ替え・削除では再変換しない */
  private readonly cache = new FragmentCache();

  private readonly manuscripts = signal<readonly ManuscriptFile[]>([]);
  /**
   * 改ページ指定。ID は位置由来 (f{n}b{m}) のため、ファイルの削除・並べ替えでは
   * 同じ ID が別ブロックを指し直す。そのため構造変更でリセットする。末尾への
   * 追記だけは既存 ID が安定なので維持する。この連動を linkedSignal で宣言する
   */
  private readonly marks = linkedSignal<readonly ManuscriptFile[], ReadonlySet<string>>({
    source: this.manuscripts,
    computation: (files, previous) =>
      previous !== undefined && new FileOrder(previous.source).isPrefixOf(files)
        ? previous.value
        : new Set<string>(),
  });
  /**
   * 変換パイプライン。manuscripts からの async 導出そのものなので resource で
   * 宣言する (再実行・進行状態・最新入力への追随は resource が担う)。
   * mermaid の SVG 化は中断できないため abortSignal は使わず、破棄された実行の
   * 結果は resource 側が捨てる
   */
  private readonly pipeline = resource({
    params: () => this.manuscripts(),
    loader: async ({ params: files }) => (isNonEmpty(files) ? this.runPipeline(files) : null),
  });

  private async runPipeline(files: readonly ManuscriptFile[]): Promise<RenderedDocument> {
    const epoch = this.cache.begin();
    await this.convertMissing(files);
    this.evictStale(epoch, files);
    return this.assembleFromCache(files);
  }

  private async convertMissing(files: readonly ManuscriptFile[]): Promise<void> {
    const toRender = files.filter((file) => !this.cache.isCached(file.content));
    const rendered = toRender.map((file) => ({ file, ...renderMarkdown(file.content) }));
    const results = await this.mermaidRenderer.render(collectMermaidBlocks(rendered));
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

  private readonly notices = signal<readonly string[]>([]);

  readonly files = this.manuscripts.asReadonly();
  readonly breaks = this.marks.asReadonly();
  readonly rendering = this.pipeline.isLoading;
  readonly warnings = this.notices.asReadonly();
  readonly nonEmpty = computed(() => this.files().length > 0);
  readonly blocks = computed<readonly Block[]>(() => this.renderedDocument()?.blocks ?? []);
  /** ファイルごとのブロック行 (階層深さ付き) */
  readonly blockGroups = computed(() => groupBlocks(this.blocks()));
  readonly rowTotal = computed(() =>
    this.blockGroups().reduce((sum, group) => sum + group.rows.length, 0),
  );
  readonly multiSource = computed(() => new Set(this.blocks().map((b) => b.fileIndex)).size > 1);

  /**
   * 変換済み変換済み文書。container は唯一の DOM 実体で、印刷対象 (PrintRoot) が
   * そのまま掲示し、プレビューは複製して使う。強制改ページのクラス付与は
   * ここでは行わない (消費者が描画時に applyForcedBreaks を適用する)
   */
  readonly renderedDocument = computed<RenderedDocument | null>(() =>
    this.pipeline.hasValue() ? (this.pipeline.value() ?? null) : null,
  );

  async addFiles(files: readonly ImportSource[]): Promise<void> {
    const { loaded, failedNames } = await this.gatherContents(files);
    const markdownOnly = loaded.filter((f) => MARKDOWN_NAME_PATTERN.test(f.name));
    const { length: accepted } = markdownOnly;
    this.notices.set(importWarnings(loaded.length - accepted, failedNames));
    this.append(markdownOnly);
  }

  private append(files: readonly ManuscriptFile[]): void {
    if (isNonEmpty(files)) {
      this.manuscripts.update((current) => [...current, ...files]);
    }
  }

  private async gatherContents(
    files: readonly ImportSource[],
  ): Promise<{ loaded: ManuscriptFile[]; failedNames: string[] }> {
    const settled = await Promise.allSettled(files.map((file) => this.readOne(file)));
    const loaded = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failedNames = files.filter((_, i) => settled[i].status === 'rejected').map((f) => f.name);
    return { loaded, failedNames };
  }

  private async readOne(file: ImportSource): Promise<ManuscriptFile> {
    return { id: this.serial++, name: file.name, content: await file.text() };
  }

  removeFile(id: number): void {
    this.applyStructuralChange((current) =>
      current.some((f) => f.id === id) ? current.filter((f) => f.id !== id) : current,
    );
  }

  /** id のファイルを delta 方向へ動かせるか */
  isMovable(id: number, delta: -1 | 1): boolean {
    return new FileOrder(this.manuscripts()).isNudgeable(id, delta);
  }

  isReorderable(from: number, to: number): boolean {
    return new FileOrder(this.manuscripts()).isMovable(from, to);
  }

  /** ファイルを 1 つ上/下へ動かす。動けるかは isMovable で先に問い合わせる */
  nudge(id: number, delta: -1 | 1): void {
    const index = this.manuscripts().findIndex((f) => f.id === id);
    this.reorder(index, index + delta);
  }

  reorder(from: number, to: number): void {
    this.applyStructuralChange((current) => new FileOrder(current).reordered(from, to));
  }

  /**
   * ファイル並びの構造変更 (削除・並べ替え) を 1 か所で扱う。updater が同一参照を
   * 返したら無変更 (改ページ指定のリセットは marks の linkedSignal が
   * source の変化から自動で行う)
   */
  private applyStructuralChange(
    updater: (current: readonly ManuscriptFile[]) => readonly ManuscriptFile[],
  ): void {
    this.manuscripts.update(updater);
  }

  toggleBreak(blockId: string): void {
    this.marks.update((current) => toggled(current, blockId));
  }
}

/** 取り込み入力。File と同じ形の最小面 (名前と本文の遅延読み出し) */
export interface ImportSource {
  readonly name: string;
  text(): Promise<string>;
}

const UNSUPPORTED_WARNING = 'Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません';

function importWarnings(nonMarkdownCount: number, failedNames: readonly string[]): string[] {
  const notice = nonMarkdownCount > 0 ? UNSUPPORTED_WARNING : null;
  const failed =
    failedNames.length > 0 ? `読み込めなかったファイル: ${failedNames.join(', ')}` : null;
  return [notice, failed].filter((warning): warning is string => warning !== null);
}

function collectMermaidBlocks(
  rendered: readonly { mermaidBlocks: readonly MermaidBlock[] }[],
): readonly MermaidBlock[] {
  return rendered.flatMap((r) => r.mermaidBlocks);
}

function isMarked(breaks: ReadonlySet<string>, blockId: string): boolean {
  return breaks.has(blockId);
}

function without(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.delete(blockId);
  return next;
}

function withAdded(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.add(blockId);
  return next;
}

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  return isMarked(current, blockId) ? without(current, blockId) : withAdded(current, blockId);
}
