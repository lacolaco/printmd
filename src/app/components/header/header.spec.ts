import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../mermaid/mermaid-renderer';
import { Manuscripts } from '../../manuscript/manuscripts';
import { Zoom } from '../../pagination/zoom';
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
});
