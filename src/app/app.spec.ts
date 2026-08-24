import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { MermaidRenderer, type MermaidLike } from './mermaid/mermaid-renderer';
import { Manuscripts } from './manuscript/manuscripts';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('空状態のヘッダはロゴのみで、印刷ボタンは出さない (刷るものがない)', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('printmd');
    expect(el.querySelector('.app-print-button')).toBeNull();
  });

  it('原稿があれば印刷ボタンが window.print を呼ぶ', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const editor = TestBed.inject(Manuscripts);
    await editor.add([{ name: 'a.md', text: () => Promise.resolve('# A') }]);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('.app-print-button')?.click();
    expect(printSpy).toHaveBeenCalled();
  });

  it('原稿がなければ全面ドロップゾーンを表示する', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.app-empty-drop')).not.toBeNull();
    expect(el.querySelector('app-file-panel')).toBeNull();
  });

  it('原稿を取り込むとプレビューと印刷用マスターを表示する', async () => {
    const editor = TestBed.inject(Manuscripts);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await editor.add([{ name: 'a.md', text: () => Promise.resolve('# 見出し') }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-preview')).not.toBeNull();
    expect(el.querySelector('app-break-panel')).not.toBeNull();
    expect(el.querySelector('.print-root h1')?.textContent).toBe('見出し');
  });

  it('原稿があればファイルチップ列とプレビューを表示する', async () => {
    const editor = TestBed.inject(Manuscripts);
    await editor.add([{ name: 'a.md', text: () => Promise.resolve('# A') }]);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-file-panel')).not.toBeNull();
    expect(el.querySelector('app-preview')).not.toBeNull();
    expect(el.querySelector('app-break-panel')).not.toBeNull();
    expect(el.querySelector('.app-empty-drop')).toBeNull();
  });
});
