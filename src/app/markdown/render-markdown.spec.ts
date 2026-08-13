import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './render-markdown';

describe('renderMarkdown', () => {
  it('見出し・段落を GFM 相当で HTML に変換する', () => {
    const { html } = renderMarkdown('# 見出し\n\n本文。');
    expect(html).toContain('<h1>見出し</h1>');
    expect(html).toContain('<p>本文。</p>');
  });

  it('表と打ち消し線を既定で有効にする (GFM 相当)', () => {
    const { html } = renderMarkdown('~~取り消し~~\n\n| a | b |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toContain('<s>取り消し</s>');
    expect(html).toContain('<table>');
  });

  it('生 HTML はエスケープする (html: false)', () => {
    const { html } = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('URL を自動リンク化する (linkify: true)', () => {
    const { html } = renderMarkdown('https://example.com へどうぞ');
    expect(html).toContain('<a href="https://example.com"');
  });

  it('タスクリストをチェックボックス付きで描画する', () => {
    const { html } = renderMarkdown('- [x] 完了\n- [ ] 未完了');
    expect(html).toContain('class="task-list-item"');
    expect(html).toMatch(/<input class="task-list-item-checkbox" checked="" disabled=""/);
    expect(html).toMatch(/<li class="task-list-item"><input class="task-list-item-checkbox" disabled=""/);
  });

  it('mermaid フェンスをプレースホルダに差し替え、コードを別途返す', () => {
    const { html, mermaidBlocks } = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```');
    expect(mermaidBlocks).toHaveLength(1);
    expect(mermaidBlocks[0].code).toBe('graph TD; A-->B;');
    expect(html).toContain(mermaidBlocks[0].id);
    expect(html).not.toContain('graph TD');
  });

  it('通常のコードフェンスは mermaid 扱いせずコードブロックにする', () => {
    const { html, mermaidBlocks } = renderMarkdown('```ts\nconst x = 1;\n```');
    expect(mermaidBlocks).toHaveLength(0);
    expect(html).toContain('<pre><code class="language-ts">');
  });

  it('複数の mermaid ブロックに一意な ID を振る', () => {
    const { mermaidBlocks } = renderMarkdown('```mermaid\nA\n```\n\n```mermaid\nB\n```');
    expect(mermaidBlocks).toHaveLength(2);
    expect(mermaidBlocks[0].id).not.toBe(mermaidBlocks[1].id);
  });

  it('言語付きコードフェンスをシンタックスハイライトする', () => {
    const { html } = renderMarkdown('```ts\nconst x: number = 1;\n```');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('language-ts');
  });

  it('未知の言語のフェンスは素のエスケープで出す', () => {
    const { html } = renderMarkdown('```unknownlang\n<tag> & text\n```');
    expect(html).toContain('&lt;tag&gt; &amp; text');
    expect(html).not.toContain('hljs-');
  });
});
