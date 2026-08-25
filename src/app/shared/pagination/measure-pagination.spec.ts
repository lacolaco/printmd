import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from '../markdown/build-rendered-document';
import { A4 } from '../paper/paper-catalog';
import { measurePagination } from './measure-pagination';

const doc = () =>
  buildRenderedDocument([
    { fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p><p>a2</p>' },
    { fileIndex: 1, fileName: 'b.md', html: '<h1>B</h1><p>b1</p>' },
  ]);

describe('measurePagination', () => {
  it('セグメントごとに計測し firstPage を積算する (jsdom は各 1 ページ)', () => {
    const pagination = measurePagination(doc(), new Set(['f0b2']), A4);
    expect(pagination.segments).toEqual([
      { start: 0, end: 2, pages: 1, firstPage: 0 },
      { start: 2, end: 3, pages: 1, firstPage: 1 },
      { start: 3, end: 5, pages: 1, firstPage: 2 },
    ]);
    expect(pagination.total).toBe(3);
    expect(document.querySelector('.measuring-area')).toBeNull();
  });
});
