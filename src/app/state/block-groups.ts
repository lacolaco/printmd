import type { Block } from '../markdown/block-extractor';

/** ブロックと、見出し階層に基づく深さ。見出しは自身のレベル、本文は直近の見出しの 1 段下 */
export interface BlockRow {
  readonly block: Block;
  readonly depth: number;
}

export interface FileGroup {
  readonly fileIndex: number;
  readonly fileName: string;
  readonly rows: readonly BlockRow[];
}

interface MutableFileGroup {
  fileIndex: number;
  fileName: string;
  rows: BlockRow[];
  /** グループ内で直近に現れた見出しのレベル。本文の深さの基準になる */
  headingLevel: number;
}

/** ファイル境界で区切ったグループ列 */
class Grouping {
  private readonly items: MutableFileGroup[] = [];

  append(block: Block): void {
    const group = this.destination(block);
    const { kind, level } = block;
    group.headingLevel = kind === 'heading' ? (level ?? 1) : group.headingLevel;
    const depth = kind === 'heading' ? (level ?? 1) : group.headingLevel + 1;
    group.rows.push({ block, depth });
  }

  /** ファイル境界では新しいグループを開始する */
  private destination(block: Block): MutableFileGroup {
    return this.lastMatching(block) ?? this.openNew(block);
  }

  private lastMatching(block: Block): MutableFileGroup | undefined {
    const last = this.items.at(-1);
    return last !== undefined && last.fileIndex === block.fileIndex ? last : undefined;
  }

  private openNew(block: Block): MutableFileGroup {
    const { fileIndex: origin, fileName: name } = block;
    const next = { fileIndex: origin, fileName: name, rows: [], headingLevel: 0 };
    this.items.push(next);
    return next;
  }

  nonEmpty(): readonly FileGroup[] {
    return this.items.filter((group) => group.rows.length > 0);
  }
}

export function groupBlocks(blocks: readonly Block[]): readonly FileGroup[] {
  const list = new Grouping();
  blocks.forEach((block) => list.append(block));
  return list.nonEmpty();
}
