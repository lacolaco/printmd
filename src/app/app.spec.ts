import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { MermaidRenderer, type MermaidLike } from './mermaid/mermaid-renderer';
import { EditorStore } from './state/editor-store';

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

  it('ヘッダにロゴと印刷ボタンを表示する', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('printmd');
    expect(el.querySelector('button')?.textContent).toContain('印刷');
  });

  it('印刷ボタンは window.print を呼ぶ', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('button')?.click();
    expect(printSpy).toHaveBeenCalled();
  });

  it('原稿がなければ取り込みを促す案内を表示する', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Markdown ファイルを取り込む');
    expect(el.querySelector('app-preview')).toBeNull();
  });

  it('原稿を取り込むとプレビューと印刷用マスターを表示する', async () => {
    const store = TestBed.inject(EditorStore);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await store.addFiles([{ name: 'a.md', text: () => Promise.resolve('# 見出し') }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-preview')).not.toBeNull();
    expect(el.querySelector('.print-root h1')?.textContent).toBe('見出し');
  });

  it('ファイル取り込みパネルと改ページ調整パネルを表示する', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-file-panel')).not.toBeNull();
    expect(el.querySelector('app-break-panel')).not.toBeNull();
  });
});
