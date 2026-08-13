import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MermaidBlock } from '../markdown/render-markdown';
import { MermaidRenderer, type MermaidLike } from './mermaid-renderer';

class FakeMermaidRenderer extends MermaidRenderer {
  result: 'ok' | 'error' = 'ok';

  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => {
        if (this.result === 'error') return Promise.reject(new Error('boom'));
        return Promise.resolve({
          svg: `<svg width="100" height="50" data-code="${code}"></svg>`,
        });
      },
    });
  }
}

describe('MermaidRenderer', () => {
  let renderer: FakeMermaidRenderer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FakeMermaidRenderer] });
    renderer = TestBed.inject(FakeMermaidRenderer);
  });

  it('コードが空なら何もせず空の結果を返す', async () => {
    const result = await renderer.render([]);
    expect(result.size).toBe(0);
  });

  it('成功した mermaid コードを svg の結果に変換する', async () => {
    const blocks: MermaidBlock[] = [{ id: 'm0', code: 'graph TD; A-->B;' }];
    const result = await renderer.render(blocks);
    const outcome = result.get('m0');
    expect(outcome).toBeDefined();
    expect(outcome && 'svg' in outcome && outcome.svg).toContain('<svg');
  });

  it('失敗した mermaid コードは元コードを保持した失敗結果にする', async () => {
    renderer.result = 'error';
    const blocks: MermaidBlock[] = [{ id: 'm0', code: 'not mermaid' }];
    const result = await renderer.render(blocks);
    const outcome = result.get('m0');
    expect(outcome).toEqual({ failed: true, code: 'not mermaid' });
  });

  it('複数ブロックをそれぞれの id で結果に格納する', async () => {
    const blocks: MermaidBlock[] = [
      { id: 'm0', code: 'A' },
      { id: 'm1', code: 'B' },
    ];
    const result = await renderer.render(blocks);
    expect([...result.keys()]).toEqual(['m0', 'm1']);
  });
});
