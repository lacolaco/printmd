import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { EditorStore } from '../state/editor-store';
import { Preview } from './preview';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('Preview', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('原稿がなければシートを作らず「- ページ」と表示する', async () => {
    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.sheet')).toHaveLength(0);
    expect(el.textContent).toContain('- ページ');
  });

  it('原稿があればマスターを複製したシートを作る (jsdom はレイアウトを持たないため 1 枚)', async () => {
    const store = TestBed.inject(EditorStore);
    await store.addFiles([{ name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文') }]);

    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const sheets = el.querySelectorAll('.sheet');
    expect(sheets).toHaveLength(1);
    expect(sheets[0].querySelector('.clip > .mc.markdown-body')).not.toBeNull();
    expect(sheets[0].querySelector('h1')?.textContent).toBe('見出し');
    expect(el.textContent).toContain('1 ページ');
  });

  it('ズームボタンで表示倍率ラベルが変わり、境界で disabled になる', async () => {
    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const zoomOut = el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!;
    const zoomIn = el.querySelector<HTMLButtonElement>('[aria-label="拡大"]')!;

    expect(el.textContent).toContain('100%');
    zoomOut.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('75%');

    for (let i = 0; i < 5; i++) {
      zoomOut.click();
      fixture.detectChanges();
    }
    expect(zoomOut.disabled).toBe(true);

    for (let i = 0; i < 10; i++) {
      zoomIn.click();
      fixture.detectChanges();
    }
    expect(zoomIn.disabled).toBe(true);
    expect(el.textContent).toContain('200%');
  });
});
