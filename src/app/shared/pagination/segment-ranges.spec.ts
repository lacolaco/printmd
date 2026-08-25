import { describe, expect, it } from 'vitest';
import type { Block } from '../markdown/block-extractor';
import { SegmentRanges } from './segment-ranges';

function block(overrides: Partial<Block> = {}): Block {
  return {
    id: 'f0b0',
    kind: 'paragraph',
    label: '',
    level: null,
    fileIndex: 0,
    fileName: 'a.md',
    isFileBoundary: false,
    ...overrides,
  };
}

describe('SegmentRanges', () => {
  it('指定なしなら全体を単一区間にする', () => {
    const ranges = new SegmentRanges();
    ranges.cutBefore(block({ id: 'f0b0' }), 0, new Set());
    ranges.cutBefore(block({ id: 'f0b1' }), 1, new Set());
    expect(ranges.closeAt(2)).toEqual([{ start: 0, end: 2 }]);
  });

  it('breaks に含まれる ID の位置で区切る', () => {
    const ranges = new SegmentRanges();
    ranges.cutBefore(block({ id: 'f0b0' }), 0, new Set(['f0b1']));
    ranges.cutBefore(block({ id: 'f0b1' }), 1, new Set(['f0b1']));
    ranges.cutBefore(block({ id: 'f0b2' }), 2, new Set(['f0b1']));
    expect(ranges.closeAt(3)).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 3 },
    ]);
  });

  it('ファイル境界ブロックは breaks 指定がなくても区切る', () => {
    const ranges = new SegmentRanges();
    ranges.cutBefore(block({ id: 'f0b0', isFileBoundary: false }), 0, new Set());
    ranges.cutBefore(block({ id: 'f1b0', isFileBoundary: true }), 1, new Set());
    expect(ranges.closeAt(2)).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
    ]);
  });

  it('先頭ブロック (index 0) への指定は区切りを生まない', () => {
    const ranges = new SegmentRanges();
    ranges.cutBefore(block({ id: 'f0b0', isFileBoundary: true }), 0, new Set(['f0b0']));
    ranges.cutBefore(block({ id: 'f0b1' }), 1, new Set(['f0b0']));
    expect(ranges.closeAt(2)).toEqual([{ start: 0, end: 2 }]);
  });

  it('区切りがなくても close は最後の区間を必ず含む', () => {
    const ranges = new SegmentRanges();
    expect(ranges.closeAt(0)).toEqual([{ start: 0, end: 0 }]);
  });
});
