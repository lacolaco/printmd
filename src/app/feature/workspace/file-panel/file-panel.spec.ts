import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../../shared/mermaid/mermaid-renderer';
import { ConversionPipeline } from '../../../shared/conversion-pipeline';
import { Manuscripts } from '../../../shared/manuscript/manuscripts';
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
  const pipeline = TestBed.inject(ConversionPipeline);
  for (let i = 0; i < 50; i++) {
    TestBed.tick();
    await appRef.whenStable();
    if (!pipeline.rendering()) return;
  }
}

describe('FilePanel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('ファイル行と追加チップを表示する', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([
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
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([
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

    expect(manuscripts.files().map((f) => f.name)).toEqual(['b.md', 'a.md']);
    const active = document.activeElement as HTMLElement | null;
    expect(active?.getAttribute('aria-label')).toContain('a.md');
  });
});

describe('FilePanel 取り込みと並べ替えの経路', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  it('ファイル選択 (input change) で取り込み、入力をリセットする', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A') }]);
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    Object.defineProperty(input, 'files', {
      value: [new File(['# B'], 'b.md')],
      configurable: true,
    });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(manuscripts.files().map((f) => f.name)).toEqual(['a.md', 'b.md']);
    expect(input.value).toBe('');
  });

  it('追加ラベルへのドロップで取り込み、既定動作を抑止する', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A') }]);
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const label = (fixture.nativeElement as HTMLElement).querySelector('label')!;
    const dragover = new Event('dragover', { cancelable: true });
    label.dispatchEvent(dragover);
    expect(dragover.defaultPrevented).toBe(true);

    const drop = new Event('drop', { cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['# B'], 'b.md')] } });
    label.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    await fixture.whenStable();
    expect(manuscripts.files().map((f) => f.name)).toEqual(['a.md', 'b.md']);
  });

  it('リストのドラッグドロップで並べ替え、読み上げ文を更新する', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([
      { name: 'a.md', text: () => Promise.resolve('# A') },
      { name: 'b.md', text: () => Promise.resolve('# B') },
    ]);
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = fixture.componentInstance as unknown as {
      onListDrop(event: { previousIndex: number; currentIndex: number }): void;
    };
    panel.onListDrop({ previousIndex: 0, currentIndex: 1 });
    fixture.detectChanges();
    expect(manuscripts.files().map((f) => f.name)).toEqual(['b.md', 'a.md']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'a.mdを2番目に移動しました',
    );
  });

  it('同じ位置へのドロップでは読み上げ文を出さない', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A') }]);
    const fixture = TestBed.createComponent(FilePanel);
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.componentInstance as unknown as {
      onListDrop(event: { previousIndex: number; currentIndex: number }): void;
    };
    panel.onListDrop({ previousIndex: 0, currentIndex: 0 });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('移動しました');
  });
});
