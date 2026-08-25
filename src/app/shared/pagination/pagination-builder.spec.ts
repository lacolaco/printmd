import { describe, expect, it } from 'vitest';
import { toPx } from '../paper/units';
import { A4 } from '../paper/paper-catalog';
import { PaginationBuilder } from './pagination-builder';

function cloneWithScrollWidth(scrollWidth: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
  return el;
}

const stepPx = toPx(A4.step);
const gapPx = toPx(A4.gap);

describe('PaginationBuilder', () => {
  it('1 段に収まる幅なら 1 ページと数える', () => {
    const builder = new PaginationBuilder(A4);
    builder.add({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    expect(builder.build()).toEqual({
      segments: [{ start: 0, end: 1, pages: 1, firstPage: 0 }],
      total: 1,
    });
  });

  it('幅がゼロでも最低 1 ページとする', () => {
    const builder = new PaginationBuilder(A4);
    builder.add({ start: 0, end: 1 }, cloneWithScrollWidth(0));
    expect(builder.build().segments[0].pages).toBe(1);
  });

  it('複数セグメントの firstPage を段数の累積で積算する', () => {
    const builder = new PaginationBuilder(A4);
    builder.add({ start: 0, end: 1 }, cloneWithScrollWidth(stepPx - gapPx));
    builder.add({ start: 1, end: 2 }, cloneWithScrollWidth(2 * stepPx - gapPx));
    const pagination = builder.build();
    expect(pagination.segments).toEqual([
      { start: 0, end: 1, pages: 1, firstPage: 0 },
      { start: 1, end: 2, pages: 2, firstPage: 1 },
    ]);
    expect(pagination.total).toBe(3);
  });

  it('何も受け取らなければ空のページ組', () => {
    expect(new PaginationBuilder(A4).build()).toEqual({ segments: [], total: 0 });
  });
});
