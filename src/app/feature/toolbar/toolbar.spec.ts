import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../shared/mermaid/mermaid-renderer';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { DEFAULT_PAPER, PAPERS } from '../../shared/paper/paper-catalog';
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

describe('Toolbar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('自身を role=toolbar として組む', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="toolbar"]')).not.toBeNull();
  });

  it('頁数・用紙・倍率を表示し、ズーム操作が Zoom に反映される', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('ページ');
    el.querySelector<HTMLButtonElement>('[aria-label="倍率を前へ"]')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(Zoom).value()).toBe(0.75);
    expect(el.textContent).toContain('75%');
  });

  it('用紙の段送りが Paper に反映される', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('[aria-label="用紙を次へ"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(TestBed.inject(Paper).format()).toBe(PAPERS.next(DEFAULT_PAPER, 1));
  });
});
