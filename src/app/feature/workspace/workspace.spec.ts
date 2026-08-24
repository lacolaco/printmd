import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../shared/mermaid/mermaid-renderer';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Workspace } from './workspace';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('Workspace', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
  });

  function dropEvent(files: File[]): Event {
    const event = new Event('drop', { cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files } });
    return event;
  }

  it('作業画面へのドロップで原稿を追加し、既定動作を抑止する', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    const fixture = TestBed.createComponent(Workspace);
    fixture.detectChanges();
    const event = dropEvent([new File(['# A'], 'a.md')]);
    (fixture.nativeElement as HTMLElement).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await fixture.whenStable();
    expect(manuscripts.files().map((f) => f.name)).toEqual(['a.md']);
  });

  it('作業画面の dragover で既定動作 (ページ遷移) を抑止する', () => {
    const fixture = TestBed.createComponent(Workspace);
    fixture.detectChanges();
    const event = new Event('dragover', { cancelable: true });
    (fixture.nativeElement as HTMLElement).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ボトムシートのハンドルで調整パネルの開閉を切り替える', async () => {
    const fixture = TestBed.createComponent(Workspace);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const handle = el.querySelector<HTMLButtonElement>('.sheet-handle')!;
    const panel = el.querySelector('#control-panel-sheet')!;
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('max-md:hidden')).toBe(true);

    handle.click();
    fixture.detectChanges();
    expect(handle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('max-md:hidden')).toBe(false);

    handle.click();
    fixture.detectChanges();
    expect(handle.getAttribute('aria-expanded')).toBe('false');
  });
});
