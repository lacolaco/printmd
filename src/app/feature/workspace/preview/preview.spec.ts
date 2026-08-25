import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../../shared/mermaid/mermaid-renderer';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import { Breaks } from '../../../shared/pagination/breaks';
import { Manuscripts } from '../../../shared/manuscript/manuscripts';
import { Zoom } from '../../../shared/pagination/zoom';
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

  it('原稿がなければシートを作らずページ数は 0', async () => {
    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.sheet')).toHaveLength(0);
    expect(TestBed.inject(Breaks).pageCount()).toBe(0);
  });

  it('原稿があればマスターを複製したシートを作る (jsdom はレイアウトを持たないため 1 枚)', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文') }]);

    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const sheets = el.querySelectorAll('.sheet');
    expect(sheets).toHaveLength(1);
    expect(sheets[0].querySelector('.clip > .mc.markdown-body')).not.toBeNull();
    expect(sheets[0].querySelector('h1')?.textContent).toBe('見出し');
    expect(TestBed.inject(Breaks).pageCount()).toBe(1);
  });

  it('IntersectionObserver がある環境では、シートは可視になるまで実体化しない', async () => {
    const observed: Element[] = [];
    let callback!: (entries: { target: Element; isIntersecting: boolean }[]) => void;
    class StubIntersectionObserver {
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
    try {
      const manuscripts = TestBed.inject(Manuscripts);
      await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文') }]);

      const fixture = TestBed.createComponent(Preview);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = fixture.nativeElement as HTMLElement;
      const sheet = el.querySelector('.sheet')!;
      expect(observed).toContain(sheet);
      expect(sheet.querySelector('.mc')).toBeNull();

      callback([{ target: sheet, isIntersecting: true }]);
      expect(sheet.querySelector('.clip > .mc.markdown-body')).not.toBeNull();
      expect(sheet.querySelector('h1')?.textContent).toBe('見出し');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ファイル境界でシートが分かれ、各シートは自セグメントのブロックだけを持つ', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([
      { name: 'a.md', text: () => Promise.resolve('# A\n\n本文a') },
      { name: 'b.md', text: () => Promise.resolve('# B\n\n本文b') },
    ]);

    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const sheets = el.querySelectorAll('.sheet');
    expect(sheets).toHaveLength(2);
    const first = sheets[0].querySelector('.mc')!;
    const second = sheets[1].querySelector('.mc')!;
    expect(first.querySelector('[data-block-id="f0b0"]')).not.toBeNull();
    expect(first.querySelector('[data-block-id^="f1"]')).toBeNull();
    expect(second.querySelector('[data-block-id="f1b0"]')).not.toBeNull();
    expect(second.querySelector('[data-block-id^="f0"]')).toBeNull();
  });

  it('変換中はプレビュー面に進行表示を出し、完了したら消す', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文') }]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(TestBed.inject(ConversionPipeline).rendering()).toBe(true);
    expect(el.querySelector('.app-rendering-indicator')).not.toBeNull();

    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(ConversionPipeline).rendering()).toBe(false);
    expect(el.querySelector('.app-rendering-indicator')).toBeNull();
  });

  it('ズーム状態 (Zoom) が紙面の表示倍率に反映される', async () => {
    const fixture = TestBed.createComponent(Preview);
    fixture.detectChanges();
    await fixture.whenStable();
    const zoomState = TestBed.inject(Zoom);
    zoomState.stepBy(-1);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[style]');
    expect(zoomState.label()).toBe('75%');
    expect(host?.style.zoom).toBe('0.75');
  });

  it('コンポーネント破棄時に IntersectionObserver を切断する', async () => {
    const disconnects: number[] = [];
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {
        disconnects.push(1);
      }
    }
    vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
    try {
      const manuscripts = TestBed.inject(Manuscripts);
      await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# 見出し') }]);
      const fixture = TestBed.createComponent(Preview);
      fixture.detectChanges();
      await fixture.whenStable();
      const before = disconnects.length;
      fixture.destroy();
      expect(disconnects.length).toBeGreaterThan(before);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
