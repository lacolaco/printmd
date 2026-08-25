import { describe, expect, it } from 'vitest';
import type { Block } from '../markdown/block';
import { groupBlocks } from './block-groups';

function block(partial: Partial<Block> & Pick<Block, 'id' | 'kind'>): Block {
  return {
    label: '',
    level: null,
    fileIndex: 0,
    fileName: 'a.md',
    isFileBoundary: false,
    ...partial,
  };
}

describe('groupBlocks', () => {
  it('ファイルごとにグループ化する', () => {
    const groups = groupBlocks([
      block({ id: 'f0b0', kind: 'heading', level: 1 }),
      block({
        id: 'f1b0',
        kind: 'heading',
        level: 1,
        fileIndex: 1,
        fileName: 'b.md',
        isFileBoundary: true,
      }),
    ]);
    expect(groups.map((g) => g.fileName)).toEqual(['a.md', 'b.md']);
    expect(groups.map((g) => g.rows.length)).toEqual([1, 1]);
  });

  it('見出しは自身のレベル、本文は直近の見出しの 1 段下の深さになる', () => {
    const groups = groupBlocks([
      block({ id: 'f0b0', kind: 'heading', level: 1 }),
      block({ id: 'f0b1', kind: 'paragraph' }),
      block({ id: 'f0b2', kind: 'heading', level: 2 }),
      block({ id: 'f0b3', kind: 'paragraph' }),
    ]);
    expect(groups[0].rows.map((r) => r.depth)).toEqual([1, 2, 2, 3]);
  });

  it('ファイル境界で見出しレベルを持ち越さない', () => {
    const groups = groupBlocks([
      block({ id: 'f0b0', kind: 'heading', level: 3 }),
      block({
        id: 'f1b0',
        kind: 'paragraph',
        fileIndex: 1,
        fileName: 'b.md',
        isFileBoundary: true,
      }),
    ]);
    expect(groups[1].rows[0].depth).toBe(1);
  });

  it('見出しの前に本文が来た場合は深さ 1 になる', () => {
    const groups = groupBlocks([block({ id: 'f0b0', kind: 'paragraph' })]);
    expect(groups[0].rows[0].depth).toBe(1);
  });
});
