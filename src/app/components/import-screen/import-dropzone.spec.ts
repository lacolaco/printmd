import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../mermaid/mermaid-renderer';
import { EditorStore } from '../../state/editor-store';
import { ImportDropzone } from './import-dropzone';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('ImportDropzone', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('「サンプル原稿で試す」でデモ原稿 2 ファイルを取り込む', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        text: async () => `# ${url}`,
      })),
    );
    const store = TestBed.inject(EditorStore);
    const fixture = TestBed.createComponent(ImportDropzone);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('サンプル原稿で試す'),
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.files().map((f) => f.name)).toEqual(['printmd-guide.md', 'hashire-merosu.md']);
  });
});

describe('ImportDropzone 取り込み経路', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('ファイル選択 (input change) で取り込む', async () => {
    const store = TestBed.inject(EditorStore);
    const fixture = TestBed.createComponent(ImportDropzone);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    Object.defineProperty(input, 'files', {
      value: [new File(['# A'], 'a.md')],
      configurable: true,
    });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(store.files().map((f) => f.name)).toEqual(['a.md']);
    expect(input.value).toBe('');
  });

  it('ドロップで取り込み、既定動作を抑止する', async () => {
    const store = TestBed.inject(EditorStore);
    const fixture = TestBed.createComponent(ImportDropzone);
    fixture.detectChanges();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label')!;
    const dragover = new Event('dragover', { cancelable: true });
    label.dispatchEvent(dragover);
    expect(dragover.defaultPrevented).toBe(true);

    const drop = new Event('drop', { cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['# A'], 'a.md')] } });
    label.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    await fixture.whenStable();
    expect(store.files().map((f) => f.name)).toEqual(['a.md']);
  });

  it('サンプル原稿ボタンで demo 配下の 2 ファイルを取り込む', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({ ok: true, text: () => Promise.resolve(`# ${url}`) }),
      ),
    );
    try {
      const store = TestBed.inject(EditorStore);
      const fixture = TestBed.createComponent(ImportDropzone);
      fixture.detectChanges();
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
      await fixture.whenStable();
      expect(store.files().map((f) => f.name)).toEqual(['printmd-guide.md', 'hashire-merosu.md']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('デモ取得が失敗したファイルは取り込まない', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false })),
    );
    try {
      const store = TestBed.inject(EditorStore);
      const fixture = TestBed.createComponent(ImportDropzone);
      fixture.detectChanges();
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
      await fixture.whenStable();
      expect(store.files()).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
