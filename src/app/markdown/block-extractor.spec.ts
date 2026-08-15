import { describe, expect, it } from 'vitest';
import { applyForcedBreaks, buildRenderedDocument, type FileFragment } from './block-extractor';

describe('buildRenderedDocument', () => {
  it('1 ファイルのトップレベル要素に f{fileIndex}b{blockIndex} の ID を振る', () => {
    const fragments: FileFragment[] = [
      { fileIndex: 0, fileName: 'a.md', html: '<h1>見出し</h1><p>本文</p>' },
    ];
    const { container, blocks } = buildRenderedDocument(fragments);
    expect(container.children[0].getAttribute('data-block-id')).toBe('f0b0');
    expect(container.children[1].getAttribute('data-block-id')).toBe('f0b1');
    expect(blocks.map((b) => b.id)).toEqual(['f0b0', 'f0b1']);
  });

  it('ブロック種別をタグから推定する', () => {
    const fragments: FileFragment[] = [
      {
        fileIndex: 0,
        fileName: 'a.md',
        html:
          '<h2>見出し</h2><p>段落</p><table></table><pre><code></code></pre>' +
          '<blockquote></blockquote><ul><li>1</li></ul><hr>',
      },
    ];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks.map((b) => b.kind)).toEqual([
      'heading',
      'paragraph',
      'table',
      'code',
      'blockquote',
      'list',
      'hr',
    ]);
  });

  it('見出しレベルを level に保持する', () => {
    const fragments: FileFragment[] = [{ fileIndex: 0, fileName: 'a.md', html: '<h3>節</h3>' }];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks[0].level).toBe(3);
  });

  it('label は見出し/段落等のテキストを短縮したもの、hr は固定文言にする', () => {
    const fragments: FileFragment[] = [
      { fileIndex: 0, fileName: 'a.md', html: '<p>' + 'あ'.repeat(50) + '</p><hr>' },
    ];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks[0].label.length).toBeLessThanOrEqual(28);
    expect(blocks[1].label).toBe('———');
  });

  it('mermaid ブロックは固定ラベルを付ける (SVG のテキストノイズを避ける)', () => {
    const fragments: FileFragment[] = [
      {
        fileIndex: 0,
        fileName: 'a.md',
        html: '<figure class="mermaid"><svg><text>A</text></svg></figure>',
      },
    ];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks[0].kind).toBe('mermaid');
    expect(blocks[0].label).toBe('mermaid 図');
  });

  it('複数ファイルを結合し、2 番目以降のファイル先頭ブロックを isFileBoundary にする', () => {
    const fragments: FileFragment[] = [
      { fileIndex: 0, fileName: 'a.md', html: '<p>A1</p><p>A2</p>' },
      { fileIndex: 1, fileName: 'b.md', html: '<p>B1</p>' },
    ];
    const { container, blocks } = buildRenderedDocument(fragments);
    expect(container.children).toHaveLength(3);
    expect(blocks.map((b) => b.id)).toEqual(['f0b0', 'f0b1', 'f1b0']);
    expect(blocks.map((b) => b.isFileBoundary)).toEqual([false, false, true]);
    expect(blocks.map((b) => b.fileName)).toEqual(['a.md', 'a.md', 'b.md']);
  });

  it('ファイルにブロックが 0 件でも後続ファイルの結合は崩れない', () => {
    const fragments: FileFragment[] = [
      { fileIndex: 0, fileName: 'empty.md', html: '' },
      { fileIndex: 1, fileName: 'b.md', html: '<p>B1</p>' },
    ];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe('f1b0');
    expect(blocks[0].isFileBoundary).toBe(true);
  });

  it('mermaid でない生 HTML の figure は mermaid 扱いしない', () => {
    const fragments: FileFragment[] = [
      {
        fileIndex: 0,
        fileName: 'a.md',
        html: '<figure><img src="a.png" alt=""><figcaption>写真の説明</figcaption></figure>',
      },
    ];
    const { blocks } = buildRenderedDocument(fragments);
    expect(blocks[0].kind).not.toBe('mermaid');
    expect(blocks[0].label).toContain('写真の説明');
  });

  it('著者が書いた id を上書きせず、ブロック ID は data-block-id で持つ', () => {
    const fragments: FileFragment[] = [
      { fileIndex: 0, fileName: 'a.md', html: '<h2 id="intro">導入</h2>' },
    ];
    const { container, blocks } = buildRenderedDocument(fragments);
    expect(container.children[0].id).toBe('intro');
    expect(container.children[0].getAttribute('data-block-id')).toBe('f0b0');
    expect(blocks[0].id).toBe('f0b0');
  });

  it('applyForcedBreaks は指定とファイル境界に forced-break を付け、解除も冪等に行う', () => {
    const { container, blocks } = buildRenderedDocument([
      { fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>本文</p>' },
      { fileIndex: 1, fileName: 'b.md', html: '<h1>B</h1>' },
    ]);
    applyForcedBreaks(container, blocks, new Set(['f0b1']));
    expect([...container.children].map((el) => el.classList.contains('forced-break'))).toEqual([
      false,
      true,
      true, // ファイル境界は常に改ページ
    ]);
    applyForcedBreaks(container, blocks, new Set());
    expect([...container.children].map((el) => el.classList.contains('forced-break'))).toEqual([
      false,
      false,
      true,
    ]);
  });
});
