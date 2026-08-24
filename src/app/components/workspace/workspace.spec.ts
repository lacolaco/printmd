import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../mermaid/mermaid-renderer';
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
