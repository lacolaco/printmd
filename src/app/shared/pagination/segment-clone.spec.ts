import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from '../markdown/build-rendered-document';
import { buildSegmentClone } from './segment-clone';

const doc = () =>
  buildRenderedDocument([
    { fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p><p>a2</p>' },
    { fileIndex: 1, fileName: 'b.md', html: '<h1>B</h1><p>b1</p>' },
  ]);

describe('buildSegmentClone', () => {
  it('指定範囲のトップレベル要素だけを複製する', () => {
    const mc = buildSegmentClone(doc(), 1, 3);
    const ids = [...mc.querySelectorAll('[data-block-id]')].map((el) =>
      el.getAttribute('data-block-id'),
    );
    expect(ids).toEqual(['f0b1', 'f0b2']);
  });

  it('元の文書のコンテナは変更しない (複製は独立した DOM)', () => {
    const document_ = doc();
    const originalChildCount = document_.container.children.length;
    buildSegmentClone(document_, 0, 2);
    expect(document_.container.children.length).toBe(originalChildCount);
  });

  it('複製した要素は元の要素と別ノードである', () => {
    const document_ = doc();
    const mc = buildSegmentClone(document_, 0, 1);
    expect(mc.querySelector('[data-block-id="f0b0"]')).not.toBe(
      document_.container.querySelector('[data-block-id="f0b0"]'),
    );
  });

  it('空範囲を渡すと子を持たないコンテナになる', () => {
    const mc = buildSegmentClone(doc(), 1, 1);
    expect(mc.querySelectorAll('[data-block-id]')).toHaveLength(0);
  });

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
