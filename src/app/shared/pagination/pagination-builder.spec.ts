import { describe, expect, it } from 'vitest';
import { MM_TO_PX } from '../paper/paper-format';
import { A4, B5 } from '../paper/paper-catalog';
import { PaginationBuilder } from './pagination-builder';

function cloneWithScrollWidth(scrollWidth: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
  return el;
}

const stepPx = A4.step * MM_TO_PX;
const gapPx = A4.gap * MM_TO_PX;

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

  it('同じ幅でも版面の狭い書式では段数が増える', () => {
    // 420mm: A4 (刻み 194mm) では 2 段、B5 (刻み 170mm) では 3 段になる幅
    const width = 420 * MM_TO_PX;
    const forA4 = new PaginationBuilder(A4);
    const forB5 = new PaginationBuilder(B5);
    forA4.add({ start: 0, end: 1 }, cloneWithScrollWidth(width));
    forB5.add({ start: 0, end: 1 }, cloneWithScrollWidth(width));
    expect(forA4.build().total).toBe(2);
    expect(forB5.build().total).toBe(3);
  });
});
