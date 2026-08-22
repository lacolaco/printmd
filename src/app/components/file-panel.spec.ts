import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { EditorStore } from '../state/editor-store';
import { FilePanel } from './file-panel';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

async function whenRendered(): Promise<void> {
  const appRef = TestBed.inject(ApplicationRef);
  const store = TestBed.inject(EditorStore);
  for (let i = 0; i < 50; i++) {
    TestBed.tick();
    await appRef.whenStable();
    if (!store.rendering()) return;
  }
}

describe('FilePanel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('ファイル行と追加チップを表示する', async () => {
    const store = TestBed.inject(EditorStore);
    await store.addFiles([
      { name: 'a.md', text: () => Promise.resolve('# A') },
      { name: 'b.md', text: () => Promise.resolve('# B') },
    ]);
    await whenRendered();
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('li')].map((li) => li.textContent)).toSatisfy(
      (texts: string[]) => texts[0].includes('a.md') && texts[1].includes('b.md'),
    );
    expect(el.textContent).toContain('+ ファイルを追加');
  });

  it('キーボード移動後、同じファイルの移動ボタンへフォーカスを戻す', async () => {
    const store = TestBed.inject(EditorStore);
    await store.addFiles([
      { name: 'a.md', text: () => Promise.resolve('# A') },
      { name: 'b.md', text: () => Promise.resolve('# B') },
    ]);
    await whenRendered();
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('button[aria-label="a.mdを下へ移動"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await whenRendered();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(store.files().map((f) => f.name)).toEqual(['b.md', 'a.md']);
    const active = document.activeElement as HTMLElement | null;
    expect(active?.getAttribute('aria-label')).toContain('a.md');
  });
});
