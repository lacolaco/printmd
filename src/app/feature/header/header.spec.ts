import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../shared/mermaid/mermaid-renderer';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Paper } from '../../shared/paper/paper';
import { Zoom } from '../../shared/pagination/zoom';
import { Header } from './header';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('Header', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('原稿がないときは表示操作も印刷ボタンも出さない (刷るものがない)', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="toolbar"]')).toBeNull();
    expect(el.querySelector('.app-print-button')).toBeNull();
  });

  it('原稿があれば頁数とズームを表示し、ズーム操作が Zoom に反映される', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Header);
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

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();

    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    expect([...select.options].map((option) => option.value)).toEqual(['a4', 'a3', 'b5']);
    select.value = 'b5';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(TestBed.inject(Paper).format().label).toBe('B5');
  });
});
