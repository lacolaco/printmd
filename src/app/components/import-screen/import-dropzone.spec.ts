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
