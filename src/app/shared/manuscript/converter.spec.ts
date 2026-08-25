import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { Converter } from './converter';
import type { ManuscriptFile } from './manuscript';

const renderSpy = vi.fn((_id: string, code: string) =>
  Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
);

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({ initialize: () => {}, render: renderSpy });
  }
}

function file(id: number, name: string, content: string): ManuscriptFile {
  return { id, name, content };
}

describe('Converter', () => {
  beforeEach(() => {
    renderSpy.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('原稿列を 1 つの変換済み文書へ変換する (ファイル順・境界つき)', async () => {
    const converter = TestBed.inject(Converter);
    const doc = await converter.render([file(1, 'a.md', '# A'), file(2, 'b.md', '# B')]);
    expect(doc.blocks.map((b) => b.label)).toEqual(['A', 'B']);
    expect(doc.blocks.map((b) => b.isFileBoundary)).toEqual([false, true]);
  });

  it('mermaid フェンスを SVG 化して文書へ織り込む', async () => {
    const converter = TestBed.inject(Converter);
    const doc = await converter.render([file(1, 'a.md', '```mermaid\ngraph TD; A-->B;\n```')]);
    expect(doc.container.querySelector('svg')).not.toBeNull();
  });

  it('同じ内容の断片はキャッシュされ、並べ替えでは再変換しない', async () => {
    const converter = TestBed.inject(Converter);
    const a = file(1, 'a.md', '```mermaid\ngraph TD; A;\n```');
    const b = file(2, 'b.md', '# B');
    await converter.render([a, b]);
    const calls = renderSpy.mock.calls.length;

    const doc = await converter.render([b, a]);
    expect(renderSpy.mock.calls.length).toBe(calls);
    expect(doc.blocks.map((b2) => b2.fileName)).toEqual(['b.md', 'a.md']);
  });

  it('列から消えた断片は追い出され、再登場時は再変換する', async () => {
    const converter = TestBed.inject(Converter);
    const a = file(1, 'a.md', '```mermaid\ngraph TD; A;\n```');
    await converter.render([a]);
    const calls = renderSpy.mock.calls.length;

    await converter.render([file(2, 'b.md', '# B')]);
    await converter.render([a]);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(calls);
  });
});
