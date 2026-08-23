import { Service, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import type { Block, RenderedDocument } from '../markdown/block-extractor';
import { isNonEmpty } from '../collections';
import { Converter } from '../manuscript/converter';
import type { ImportSource, ManuscriptFile } from '../manuscript/manuscript';
import { groupBlocks } from './block-groups';
import { FileOrder } from './file-order';

const MARKDOWN_NAME_PATTERN = /\.(md|markdown|txt)$/i;

/**
 * アプリの状態。signals の一方向伝播:
 * 原稿ファイル → 変換 (Converter) → ブロック一覧。
 * 改ページ Set はタブ寿命のみで原稿を書き換えない。
 */
@Service()
export class EditorStore {
  private readonly converter = inject(Converter);

  private serial = 1;

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
    loader: async ({ params: files }) => (isNonEmpty(files) ? this.converter.render(files) : null),
  });

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
    if (isNonEmpty(files)) {
      await this.ingest(files);
    }
  }

  private async ingest(files: readonly ImportSource[]): Promise<void> {
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

const UNSUPPORTED_WARNING = 'Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません';

function importWarnings(nonMarkdownCount: number, failedNames: readonly string[]): string[] {
  const notice = nonMarkdownCount > 0 ? UNSUPPORTED_WARNING : null;
  const failed =
    failedNames.length > 0 ? `読み込めなかったファイル: ${failedNames.join(', ')}` : null;
  return [notice, failed].filter((warning): warning is string => warning !== null);
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
