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

/** ブロック列をファイルごとのグループへ分け、各ブロックに階層深さを与える */
export function groupBlocks(blocks: readonly Block[]): readonly FileGroup[] {
  const groups: FileGroup[] = [];
  let current: { fileIndex: number; fileName: string; rows: BlockRow[] } | null = null;
  let currentHeadingLevel = 0;
  for (const block of blocks) {
    if (current === null || block.fileIndex !== current.fileIndex) {
      // ファイル境界で階層をリセットする (前ファイルの見出しレベルを持ち越さない)
      currentHeadingLevel = 0;
      current = { fileIndex: block.fileIndex, fileName: block.fileName, rows: [] };
      groups.push(current);
    }
    if (block.kind === 'heading') currentHeadingLevel = block.level ?? 1;
    const depth = block.kind === 'heading' ? (block.level ?? 1) : currentHeadingLevel + 1;
    current.rows.push({ block, depth });
  }
  return groups.filter((group) => group.rows.length > 0);
}
