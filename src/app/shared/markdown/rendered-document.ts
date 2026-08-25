import { ifDefined } from '../optional';
import type { Block } from './block';
import { groupBlocks, type FileGroup } from './block-groups';

/** 変換済み文書の実体。container は唯一の DOM で、掲示は自身が担う */
export class RenderedDocument {
  constructor(
    readonly container: HTMLElement,
    readonly blocks: readonly Block[],
  ) {}

  private grouped: readonly FileGroup[] | null = null;

  /** ファイルごとのブロック行 (階層深さ付き)。不変な自身に対する遅延メモ */
  groups(): readonly FileGroup[] {
    return (this.grouped ??= groupBlocks(this.blocks));
  }

  rowTotal(): number {
    return this.groups().reduce((sum, group) => sum + group.rows.length, 0);
  }

  isMultiSource(): boolean {
    return new Set(this.blocks.map((b) => b.fileIndex)).size > 1;
  }

  /** 強制改ページを反映して掲示先へ自身を取り付ける */
  mount(host: HTMLElement, breaks: ReadonlySet<string>): void {
    this.markBreaks(breaks);
    host.append(this.container);
  }

  /**
   * 強制改ページ (指定 Set とファイル境界) をトップレベル要素へクラスとして
   * 反映する。冪等 (toggle) なので何度適用してもよい。呼び出しは消費者の
   * 描画時に行う (computed の読み取りに DOM 変異を持ち込まない取り決め)
   */
  markBreaks(breaks: ReadonlySet<string>): void {
    [...this.container.children].forEach((el, index) =>
      ifDefined(this.blocks[index], (block) =>
        el.classList.toggle('forced-break', block.isFileBoundary || breaks.has(block.id)),
      ),
    );
  }
}
