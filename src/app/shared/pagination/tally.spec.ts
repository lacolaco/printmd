import { describe, expect, it } from 'vitest';
import { Tally, tallySegments } from './tally';
import { MM_TO_PX } from '../paper/paper-format';
import { A4, B5 } from '../paper/paper-catalog';

function cloneWithScrollWidth(scrollWidth: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
  return el;
}

const stepPx = A4.step * MM_TO_PX;
const gapPx = A4.gap * MM_TO_PX;

describe('Tally', () => {
  it('1 段に収まる幅なら 1 ページと数える', () => {
    const tally = new Tally(A4);
    tally.add({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    expect(tally.result()).toEqual({
      segments: [{ start: 0, end: 1, pages: 1, firstPage: 0 }],
      total: 1,
    });
  });

  it('幅がゼロでも最低 1 ページとする', () => {
    const tally = new Tally(A4);
    tally.add({ start: 0, end: 1 }, cloneWithScrollWidth(0));
    expect(tally.result().segments[0].pages).toBe(1);
  });

  it('複数セグメントの firstPage を段数の累積で積算する', () => {
    const tally = new Tally(A4);
    tally.add({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    tally.add({ start: 1, end: 2 }, cloneWithScrollWidth(2 * stepPx - gapPx));
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
    expect(tallySegments(ranges, clones, A4)).toEqual({
      segments: [
        { start: 0, end: 1, pages: 1, firstPage: 0 },
        { start: 1, end: 2, pages: 1, firstPage: 1 },
      ],
      total: 2,
    });
  });

  it('range が空なら結果も空でページ数 0', () => {
    expect(tallySegments([], [], A4)).toEqual({ segments: [], total: 0 });
  });
});

describe('書式ごとの段の刻み', () => {
  it('同じ幅でも版面の狭い書式では段数が増える', () => {
    // 420mm: A4 (刻み 194mm) では 2 段、B5 (刻み 170mm) では 3 段になる幅
    const width = 420 * MM_TO_PX;
    const clone = cloneWithScrollWidth(width);
    expect(tallySegments([{ start: 0, end: 1 }], [clone], A4).total).toBe(2);
    expect(tallySegments([{ start: 0, end: 1 }], [clone], B5).total).toBe(3);
  });
});
