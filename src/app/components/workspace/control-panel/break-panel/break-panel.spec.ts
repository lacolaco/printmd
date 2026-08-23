import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../../../mermaid/mermaid-renderer';
import { BreakState } from '../../../../state/break.state';
import { Editor } from '../../../editor';
import { BreakPanel } from './break-panel';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

describe('BreakPanel', () => {
  let editor: Editor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
    editor = TestBed.inject(Editor);
  });

  it('主要ブロックのチェック行を表示し、チェックで改ページを指定する', async () => {
    await editor.addFiles([
      { name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文の段落') },
    ]);
    const fixture = TestBed.createComponent(BreakPanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const checkbox = el.querySelector<HTMLInputElement>('li input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    checkbox!.click();
    fixture.detectChanges();
    expect(TestBed.inject(BreakState).ids().size).toBe(1);
    checkbox!.click();
    fixture.detectChanges();
    expect(TestBed.inject(BreakState).ids().size).toBe(0);
  });

  it('段落を含む全ブロックの行を document 順に表示する', async () => {
    await editor.addFiles([
      { name: 'a.md', text: () => Promise.resolve('# 見出し\n\n本文の段落') },
    ]);
    const fixture = TestBed.createComponent(BreakPanel);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('li').length).toBe(2);
  });
});
