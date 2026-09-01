import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { Manuscripts } from '../manuscript/manuscripts';
import { ConversionPipeline } from '../conversion-pipeline';
import { Breaks } from './breaks';
import type { Block } from '../markdown/block';
import { Direction } from '../support/direction';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

function file(name: string, content: string) {
  return { name, text: () => Promise.resolve(content) };
}

function blocksOf(): readonly Block[] {
  return TestBed.inject(ConversionPipeline).renderedDocument()?.blocks ?? [];
}

async function whenRendered(): Promise<void> {
  const appRef = TestBed.inject(ApplicationRef);
  const pipeline = TestBed.inject(ConversionPipeline);
  for (let i = 0; i < 50; i++) {
    TestBed.tick();
    await appRef.whenStable();
    if (!pipeline.isRendering()) return;
  }
}

describe('Breaks', () => {
  let manuscripts: Manuscripts;
  let breaks: Breaks;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
    manuscripts = TestBed.inject(Manuscripts);
    breaks = TestBed.inject(Breaks);
  });

  it('初期状態は改ページ指定なし', () => {
    expect(breaks.ids()).toEqual(new Set());
    expect(breaks.pageCount()).toBe(0);
  });

  it('toggle で指定を追加し、再度 toggle すると解除する', () => {
    breaks.toggle('f0b0');
    expect(breaks.ids().has('f0b0')).toBe(true);
    breaks.toggle('f0b0');
    expect(breaks.ids().has('f0b0')).toBe(false);
  });

  it('文書がなければ pagination は null', () => {
    expect(breaks.pagination()).toBeNull();
  });

  it('文書があれば pageCount は測定結果を反映する (jsdom は 1 ページ)', async () => {
    await manuscripts.add([file('a.md', '# 見出し\n\n本文')]);
    await whenRendered();
    expect(breaks.pageCount()).toBe(1);
  });

  it('原稿列の構造変更 (削除) で指定がリセットされる', async () => {
    await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
    await whenRendered();
    const id = blocksOf()[0].id;
    breaks.toggle(id);
    expect(breaks.ids().has(id)).toBe(true);
    manuscripts.remove(manuscripts.files()[0].id);
    await whenRendered();
    expect(breaks.ids().size).toBe(0);
  });

  it('原稿列の構造変更 (並べ替え) で指定がリセットされる', async () => {
    await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
    await whenRendered();
    breaks.toggle(blocksOf()[0].id);
    manuscripts.nudge(manuscripts.files()[0].id, Direction.Forward);
    await whenRendered();
    expect(breaks.ids().size).toBe(0);
  });

  it('末尾への追記だけでは指定を維持する', async () => {
    await manuscripts.add([file('a.md', '# A')]);
    await whenRendered();
    breaks.toggle(blocksOf()[0].id);
    await manuscripts.add([file('b.md', '# B')]);
    await whenRendered();
    expect(breaks.ids().has('f0b0')).toBe(true);
  });
});
