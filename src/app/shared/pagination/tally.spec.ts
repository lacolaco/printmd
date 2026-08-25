import { describe, expect, it } from 'vitest';
import { Tally, tallySegments } from './tally';
import { A4, MM_TO_PX } from './page-geometry';

function cloneWithScrollWidth(scrollWidth: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
  return el;
}

const stepPx = A4.column.step * MM_TO_PX;
const gapPx = A4.column.gap * MM_TO_PX;

describe('Tally', () => {
  it('1 段に収まる幅なら 1 ページと数える', () => {
    const tally = new Tally();
    tally.absorb({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    expect(tally.result()).toEqual({
      segments: [{ start: 0, end: 1, pages: 1, firstPage: 0 }],
      total: 1,
    });
  });

  it('幅がゼロでも最低 1 ページとする', () => {
    const tally = new Tally();
    tally.absorb({ start: 0, end: 1 }, cloneWithScrollWidth(0));
    expect(tally.result().segments[0].pages).toBe(1);
  });

  it('複数セグメントの firstPage を段数の累積で積算する', () => {
    const tally = new Tally();
    tally.absorb({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    tally.absorb({ start: 1, end: 2 }, cloneWithScrollWidth(2 * stepPx - gapPx));
    const result = tally.result();
    expect(result.segments).toEqual([
      { start: 0, end: 1, pages: 1, firstPage: 0 },
      { start: 1, end: 2, pages: 2, firstPage: 1 },
    ]);
    expect(result.total).toBe(3);
  });
});

describe('tallySegments', () => {
  it('ranges と clones を対応付けて Tally と同じ結果を導く', () => {
    const ranges = [
      { start: 0, end: 1 },
      { start: 1, end: 2 },
    ];
    const clones = [cloneWithScrollWidth(stepPx - gapPx), cloneWithScrollWidth(stepPx - gapPx)];
    expect(tallySegments(ranges, clones)).toEqual({
      segments: [
        { start: 0, end: 1, pages: 1, firstPage: 0 },
        { start: 1, end: 2, pages: 1, firstPage: 1 },
      ],
      total: 2,
    });
  });

  it('range が空なら結果も空でページ数 0', () => {
    expect(tallySegments([], [])).toEqual({ segments: [], total: 0 });
  });
});
