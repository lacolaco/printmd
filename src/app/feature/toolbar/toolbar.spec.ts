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

describe('Toolbar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('頁数と表示倍率を出し、倍率の操作が Zoom に反映される', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('ページ');
    el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(Zoom).label()).toBe('75%');
    expect(el.textContent).toContain('75%');
  });

  it('用紙セレクタの選択が Paper に反映される', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const other = PAPERS[PAPERS.length - 1];
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    const labels = [...select.options].map((option) => option.textContent?.trim());
    expect(labels).toEqual(PAPERS.map((paper) => paper.label));
    select.value = other.label;
    select.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(TestBed.inject(Paper).format()).toBe(other);
  });

  it('用紙セレクタはロービング focus のツールバーの外に置く', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="toolbar"] select')).toBeNull();
    expect(el.querySelector('select')).not.toBeNull();
  });
});
