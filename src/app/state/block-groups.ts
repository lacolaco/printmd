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
}

interface GroupAccumulator {
  readonly groups: MutableFileGroup[];
  current: MutableFileGroup | null;
  headingLevel: number;
}

/** ファイル境界で階層をリセットする (前ファイルの見出しレベルを持ち越さない) */
function startFileGroup(acc: GroupAccumulator, block: Block): void {
  acc.headingLevel = 0;
  const group: MutableFileGroup = { fileIndex: block.fileIndex, fileName: block.fileName, rows: [] };
  acc.groups.push(group);
  acc.current = group;
}

function accumulateBlock(acc: GroupAccumulator, block: Block): void {
  if (acc.current === null || block.fileIndex !== acc.current.fileIndex) startFileGroup(acc, block);
  if (block.kind === 'heading') acc.headingLevel = block.level ?? 1;
  const depth = block.kind === 'heading' ? (block.level ?? 1) : acc.headingLevel + 1;
  acc.current!.rows.push({ block, depth });
}

/** ブロック列をファイルごとのグループへ分け、各ブロックに階層深さを与える */
export function groupBlocks(blocks: readonly Block[]): readonly FileGroup[] {
  const acc: GroupAccumulator = { groups: [], current: null, headingLevel: 0 };
  blocks.forEach((block) => accumulateBlock(acc, block));
  return acc.groups.filter((group) => group.rows.length > 0);
}
