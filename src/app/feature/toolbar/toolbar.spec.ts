import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../shared/mermaid/mermaid-renderer';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { PAPERS } from '../../shared/paper/paper-catalog';
import { Paper } from '../../shared/paper/paper';
import { Zoom } from '../../shared/pagination/zoom';
import { Toolbar } from './toolbar';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

async function render() {
  const fixture = TestBed.createComponent(Toolbar);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('Toolbar', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
    await TestBed.inject(Manuscripts).add([
      { name: 'a.md', text: () => Promise.resolve('# A\n\n本文') },
    ]);
  });

  it('自身を role=toolbar として組む', async () => {
    const { el } = await render();
    expect(el.querySelector('[role="toolbar"]')).not.toBeNull();
  });

  it('頁数を読み上げ対象として出す', async () => {
    const { el } = await render();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('ページ');
  });

  it('倍率を下げる操作が Zoom に反映される', async () => {
    const { fixture, el } = await render();
    el.querySelector<HTMLButtonElement>('[aria-label^="倍率"][aria-label$="を下げる"]')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(Zoom).value()).toBe(0.75);
    expect(el.textContent).toContain('75%');
  });

  it('用紙を次へ変える操作が Paper に反映される', async () => {
    const { fixture, el } = await render();
    el.querySelector<HTMLButtonElement>('[aria-label^="用紙"][aria-label$="を次へ"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(TestBed.inject(Paper).format()).toBe(PAPERS.next(PAPERS.initial, 1));
  });
});
