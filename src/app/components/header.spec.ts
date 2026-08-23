import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { EditorStore } from '../state/editor-store';
import { ViewerState } from '../state/viewer-state';
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

  it('原稿があれば頁数とズームを表示し、ズーム操作が ViewerState に反映される', async () => {
    const store = TestBed.inject(EditorStore);
    await store.addFiles([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('ページ');
    el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(ViewerState).zoom.label()).toBe('75%');
    expect(el.textContent).toContain('75%');
  });
});
