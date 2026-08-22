import { Service, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import type { Block, FileFragment, RenderedDocument } from '../markdown/block-extractor';
import { buildRenderedDocument } from '../markdown/block-extractor';
import { applyMermaidResults } from '../mermaid/apply-mermaid-results';
import { groupBlocks } from './block-groups';
import { MermaidRenderer, type MermaidOutcome } from '../mermaid/mermaid-renderer';
import { renderMarkdown } from '../markdown/render-markdown';

/** 取り込んだ原稿ファイル。content は不変 (原稿は書き換えない) */
export interface ManuscriptFile {
  readonly id: number;
  readonly name: string;
  readonly content: string;
}

const MARKDOWN_NAME_PATTERN = /\.(md|markdown|txt)$/i;

/** prev が next の先頭部分か (要素は同一参照)。真なら「末尾への追記だけ」の変化 */
function isPrefixOf(prev: readonly ManuscriptFile[], next: readonly ManuscriptFile[]): boolean {
  if (prev.length > next.length) return false;
  return prev.every((file, index) => next[index] === file);
}

/**
 * アプリの状態。signals の一方向伝播:
 * 原稿ファイル → markdown-it 変換 → mermaid SVG 化 → マスター HTML 構築 →
 * ブロック一覧。改ページ Set はタブ寿命のみで原稿を書き換えない。
 */
@Service()
export class EditorStore {
  private readonly mermaidRenderer = inject(MermaidRenderer);

  private nextFileId = 1;
  /** ファイル内容 → mermaid 適用済み HTML のキャッシュ。並べ替え・削除では再変換しない */
  private readonly fragmentCache = new Map<string, string>();
  /**
   * loader の世代。mermaid 待ちの間に params が変わると複数の loader が重なり、
   * 遅れて解決した古い loader が古い keep 集合でキャッシュを追い出す競合がある
   * (現行文書のエントリを消して結果を壊す)。追い出しは最新世代だけが行う
   */
  private renderEpoch = 0;

  private readonly filesSignal = signal<readonly ManuscriptFile[]>([]);
  /**
   * 改ページ指定。ID は位置由来 (f{n}b{m}) のため、ファイルの削除・並べ替えでは
   * 同じ ID が別ブロックを指し直す。そのため構造変更でリセットする。末尾への
   * 追記だけは既存 ID が安定なので維持する。この連動を linkedSignal で宣言する
   */
  private readonly breaksSignal = linkedSignal<readonly ManuscriptFile[], ReadonlySet<string>>({
    source: this.filesSignal,
    computation: (files, previous) => {
      if (previous !== undefined && isPrefixOf(previous.source, files)) return previous.value;
      return new Set();
    },
  });
  /**
   * 変換パイプライン。filesSignal からの async 導出そのものなので resource で
   * 宣言する (再実行・進行状態・最新入力への追随は resource が担う)。
   * mermaid の SVG 化は中断できないため abortSignal は使わず、破棄された実行の
   * 結果は resource 側が捨てる
   */
  private readonly renderedResource = resource({
    params: () => this.filesSignal(),
    loader: async ({ params: files }) => {
      if (files.length === 0) return null;
      const epoch = ++this.renderEpoch;
      await this.renderNewFragments(files);
      this.evictStaleFragments(epoch, files);
      return this.buildDocumentFromCache(files);
    },
  });

  private async renderNewFragments(files: readonly ManuscriptFile[]): Promise<void> {
    const toRender = files.filter((file) => !this.fragmentCache.has(file.content));
    const rendered = toRender.map((file) => ({ file, ...renderMarkdown(file.content) }));
    const results = await this.mermaidRenderer.render(rendered.flatMap((r) => r.mermaidBlocks));
    this.storeFragments(rendered, results);
  }

  private storeFragments(
    rendered: readonly { file: ManuscriptFile; html: string }[],
    results: ReadonlyMap<string, MermaidOutcome>,
  ): void {
    for (const r of rendered) {
      this.fragmentCache.set(r.file.content, applyMermaidResults(r.html, results));
    }
  }

  private evictStaleFragments(epoch: number, files: readonly ManuscriptFile[]): void {
    if (epoch !== this.renderEpoch) return;
    const keep = new Set(files.map((file) => file.content));
    for (const key of this.fragmentCache.keys()) {
      if (!keep.has(key)) this.fragmentCache.delete(key);
    }
  }

  private buildDocumentFromCache(files: readonly ManuscriptFile[]): RenderedDocument {
    return buildRenderedDocument(files.map((file, index) => this.cachedFragment(file, index)));
  }

  /** 古い loader は最新世代の追い出しでエントリを失い得るが、その結果は resource が捨てる */
  private cachedFragment(file: ManuscriptFile, fileIndex: number): FileFragment {
    return { fileIndex, fileName: file.name, html: this.fragmentCache.get(file.content) ?? '' };
  }

  private readonly importWarningsSignal = signal<readonly string[]>([]);

  readonly files = this.filesSignal.asReadonly();
  readonly breaks = this.breaksSignal.asReadonly();
  readonly rendering = this.renderedResource.isLoading;
  readonly warnings = this.importWarningsSignal.asReadonly();
  readonly hasFiles = computed(() => this.files().length > 0);
  readonly blocks = computed<readonly Block[]>(() => this.renderedDocument()?.blocks ?? []);
  /** ファイルごとのブロック行 (階層深さ付き) */
  readonly blockGroups = computed(() => groupBlocks(this.blocks()));
  readonly blockRowCount = computed(() =>
    this.blockGroups().reduce((sum, group) => sum + group.rows.length, 0),
  );
  readonly multiFile = computed(() => new Set(this.blocks().map((b) => b.fileIndex)).size > 1);

  /**
   * 変換済み変換済み文書。container は唯一の DOM 実体で、印刷対象 (PrintRoot) が
   * そのまま掲示し、プレビューは複製して使う。強制改ページのクラス付与は
   * ここでは行わない (消費者が描画時に applyForcedBreaks を適用する)
   */
  readonly renderedDocument = computed<RenderedDocument | null>(() =>
    this.renderedResource.hasValue() ? (this.renderedResource.value() ?? null) : null,
  );

  async addFiles(files: readonly ImportSource[]): Promise<void> {
    const { loaded, failedNames } = await this.loadContents(files);
    const markdownOnly = loaded.filter((f) => MARKDOWN_NAME_PATTERN.test(f.name));
    this.importWarningsSignal.set(importWarnings(loaded.length - markdownOnly.length, failedNames));
    if (markdownOnly.length > 0) {
      this.filesSignal.update((current) => [...current, ...markdownOnly]);
    }
  }

  private async loadContents(
    files: readonly ImportSource[],
  ): Promise<{ loaded: ManuscriptFile[]; failedNames: string[] }> {
    const settled = await Promise.allSettled(files.map((file) => this.loadContent(file)));
    const loaded = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failedNames = files.filter((_, i) => settled[i].status === 'rejected').map((f) => f.name);
    return { loaded, failedNames };
  }

  private async loadContent(file: ImportSource): Promise<ManuscriptFile> {
    return { id: this.nextFileId++, name: file.name, content: await file.text() };
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
    return this.applyStructuralChange((current) => reordered(current, fromIndex, toIndex));
  }

  /**
   * ファイル並びの構造変更 (削除・並べ替え) を 1 か所で扱う。updater が同一参照を
   * 返したら無変更 (改ページ指定のリセットは breaksSignal の linkedSignal が
   * source の変化から自動で行う)
   */
  private applyStructuralChange(
    updater: (current: readonly ManuscriptFile[]) => readonly ManuscriptFile[],
  ): boolean {
    const before = this.filesSignal();
    this.filesSignal.update(updater);
    return this.filesSignal() !== before;
  }

  toggleBreak(blockId: string): void {
    this.breaksSignal.update((current) => toggled(current, blockId));
  }
}

interface ImportSource {
  readonly name: string;
  text(): Promise<string>;
}

const NON_MARKDOWN_WARNING = 'Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません';

function importWarnings(nonMarkdownCount: number, failedNames: readonly string[]): string[] {
  const nonMarkdown = nonMarkdownCount > 0 ? NON_MARKDOWN_WARNING : null;
  const failed =
    failedNames.length > 0 ? `読み込めなかったファイル: ${failedNames.join(', ')}` : null;
  return [nonMarkdown, failed].filter((warning): warning is string => warning !== null);
}

function reordered(
  current: readonly ManuscriptFile[],
  fromIndex: number,
  toIndex: number,
): readonly ManuscriptFile[] {
  if (!isValidMove(current.length, fromIndex, toIndex)) return current;
  const next = [...current];
  next.splice(toIndex, 0, ...next.splice(fromIndex, 1));
  return next;
}

function isValidMove(length: number, from: number, to: number): boolean {
  return from !== to && from >= 0 && to >= 0 && from < length && to < length;
}

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  if (!next.delete(blockId)) next.add(blockId);
  return next;
}
