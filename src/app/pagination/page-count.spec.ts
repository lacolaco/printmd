import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from '../markdown/block-extractor';
import { measurePagination, splitAtForcedBreaks } from './page-count';
import { buildSegmentClone } from './segment-clone';

const doc = () =>
  buildRenderedDocument([
    { fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p><p>a2</p>' },
    { fileIndex: 1, fileName: 'b.md', html: '<h1>B</h1><p>b1</p>' },
  ]);

describe('splitAtForcedBreaks', () => {
  it('指定がなければファイル境界だけで分割する', () => {
    expect(splitAtForcedBreaks(doc().blocks, new Set())).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 5 },
    ]);
  });

  it('チェック指定の位置でも分割する', () => {
    expect(splitAtForcedBreaks(doc().blocks, new Set(['f0b2']))).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 3 },
      { start: 3, end: 5 },
    ]);
  });

  it('文書先頭のブロックへの指定は区切りを生まない', () => {
    expect(splitAtForcedBreaks(doc().blocks, new Set(['f0b0']))).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 5 },
    ]);
  });
});

describe('buildSegmentClone', () => {
  it('先頭セグメントはブロックを直接持つ (文書先頭のマージン除去を受ける)', () => {
    const mc = buildSegmentClone(doc(), 0, 3);
    expect(mc.classList.contains('mc')).toBe(true);
    expect(mc.classList.contains('markdown-body')).toBe(true);
    expect([...mc.children].map((el) => el.getAttribute('data-block-id'))).toEqual([
      'f0b0',
      'f0b1',
      'f0b2',
    ]);
  });

  it('2 番目以降のセグメントはラッパで包む (改ページ後の上マージンを印刷と同様に保持する)', () => {
    const mc = buildSegmentClone(doc(), 3, 5);
    expect(mc.children).toHaveLength(1);
    expect(mc.firstElementChild!.getAttribute('data-block-id')).toBeNull();
    expect(
      [...mc.firstElementChild!.children].map((el) => el.getAttribute('data-block-id')),
    ).toEqual(['f1b0', 'f1b1']);
  });
});

describe('measurePagination', () => {
  it('セグメントごとに計測し firstPage を積算する (jsdom は各 1 ページ)', () => {
    const pagination = measurePagination(doc(), new Set(['f0b2']));
    expect(pagination.segments).toEqual([
      { start: 0, end: 2, pages: 1, firstPage: 0 },
      { start: 2, end: 3, pages: 1, firstPage: 1 },
      { start: 3, end: 5, pages: 1, firstPage: 2 },
    ]);
    expect(pagination.total).toBe(3);
    expect(document.querySelector('.preview-probe')).toBeNull();
  });
});
