import { describe, expect, it } from 'vitest';
import { applyMermaidResults } from './apply-mermaid-results';

describe('applyMermaidResults', () => {
  it('成功結果を <figure class="mermaid"> に差し替える', () => {
    const html = '<p>前</p><div class="mermaid-placeholder" id="m0"></div><p>後</p>';
    const results = new Map([['m0', { svg: '<svg>X</svg>' }]]);
    const out = applyMermaidResults(html, results);
    expect(out).toContain('<figure class="mermaid"><svg>X</svg></figure>');
    expect(out).not.toContain('mermaid-placeholder');
  });

  it('失敗結果は元コードのコードブロック + 警告文に差し替える', () => {
    const html = '<div class="mermaid-placeholder" id="m0"></div>';
    const results = new Map([['m0', { failed: true as const, code: 'A-->B' }]]);
    const out = applyMermaidResults(html, results);
    expect(out).toContain('<pre><code>A--&gt;B</code></pre>');
    expect(out).toContain('class="mermaid-warning"');
  });

  it('結果に含まれないプレースホルダはそのまま残す', () => {
    const html = '<div class="mermaid-placeholder" id="m0"></div>';
    const out = applyMermaidResults(html, new Map());
    expect(out).toContain('mermaid-placeholder');
  });

  it('プレースホルダを含まない HTML はそのまま返す', () => {
    const html = '<p>本文のみ</p>';
    expect(applyMermaidResults(html, new Map())).toBe(html);
  });
});
