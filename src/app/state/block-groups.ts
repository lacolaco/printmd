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

/** ブロックの属するグループを返す。ファイル境界では新しいグループを開始する */
function groupFor(groups: MutableFileGroup[], block: Block): MutableFileGroup {
  const last = groups.at(-1);
  if (last !== undefined && last.fileIndex === block.fileIndex) return last;
  const next = { fileIndex: block.fileIndex, fileName: block.fileName, rows: [], headingLevel: 0 };
  groups.push(next);
  return next;
}

function appendBlock(groups: MutableFileGroup[], block: Block): void {
  const group = groupFor(groups, block);
  const { kind, level } = block;
  if (kind === 'heading') group.headingLevel = level ?? 1;
  const depth = kind === 'heading' ? (level ?? 1) : group.headingLevel + 1;
  group.rows.push({ block, depth });
}

function nonEmptyGroups(groups: readonly MutableFileGroup[]): readonly FileGroup[] {
  return groups.filter((group) => group.rows.length > 0);
}

export function groupBlocks(blocks: readonly Block[]): readonly FileGroup[] {
  const groups: MutableFileGroup[] = [];
  blocks.forEach((block) => appendBlock(groups, block));
  return nonEmptyGroups(groups);
}
