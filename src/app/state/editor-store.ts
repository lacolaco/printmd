import { Service, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import type { Block, RenderedDocument } from '../markdown/block-extractor';
import { buildRenderedDocument } from '../markdown/block-extractor';
import { applyMermaidResults } from '../mermaid/apply-mermaid-results';
import { MermaidRenderer } from '../mermaid/mermaid-renderer';
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
      const toRender = files.filter((file) => !this.fragmentCache.has(file.content));
      const rendered = toRender.map((file) => ({ file, ...renderMarkdown(file.content) }));
      const results = await this.mermaidRenderer.render(rendered.flatMap((r) => r.mermaidBlocks));
      rendered.forEach((r) => {
        this.fragmentCache.set(r.file.content, applyMermaidResults(r.html, results));
      });
      if (epoch === this.renderEpoch) {
        const keep = new Set(files.map((file) => file.content));
        for (const key of this.fragmentCache.keys()) {
          if (!keep.has(key)) this.fragmentCache.delete(key);
        }
      }
      return buildRenderedDocument(
        files.map((file, fileIndex) => ({
          fileIndex,
          fileName: file.name,
          // 古い loader は最新世代の追い出しでエントリを失い得るが、その結果は resource が捨てる
          html: this.fragmentCache.get(file.content) ?? '',
        })),
      );
    },
  });
  private readonly importWarningsSignal = signal<readonly string[]>([]);

  readonly files = this.filesSignal.asReadonly();
  readonly breaks = this.breaksSignal.asReadonly();
  readonly rendering = this.renderedResource.isLoading;
  readonly warnings = this.importWarningsSignal.asReadonly();
  readonly hasFiles = computed(() => this.files().length > 0);
  readonly blocks = computed<readonly Block[]>(() => this.renderedDocument()?.blocks ?? []);

  /**
   * 変換済み変換済み文書。container は唯一の DOM 実体で、印刷対象 (PrintRoot) が
   * そのまま掲示し、プレビューは複製して使う。強制改ページのクラス付与は
   * ここでは行わない (消費者が描画時に applyForcedBreaks を適用する)
   */
  readonly renderedDocument = computed<RenderedDocument | null>(() =>
    this.renderedResource.hasValue() ? (this.renderedResource.value() ?? null) : null,
  );

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
    this.breaksSignal.update((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }


}
