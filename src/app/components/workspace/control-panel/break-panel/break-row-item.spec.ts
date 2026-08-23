import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { Block } from '../../../../markdown/block-extractor';
import type { BlockRow } from '../../../../state/block-groups';
import { BreakRowItem } from './break-row-item';

function block(partial: Partial<Block> & Pick<Block, 'id' | 'kind'>): Block {
  return {
    label: '',
    level: null,
    fileIndex: 0,
    fileName: 'a.md',
    isFileBoundary: false,
    ...partial,
  };
}

@Component({
  imports: [BreakRowItem],
  template: `<app-break-row-item
    [row]="row()"
    [checked]="checked()"
    (toggled)="toggles = toggles + 1"
  />`,
})
class Host {
  readonly row = signal<BlockRow>({ block: block({ id: 'f0b0', kind: 'paragraph' }), depth: 1 });
  readonly checked = signal(false);
  toggles = 0;
}

function render(row: BlockRow, checked = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.row.set(row);
  fixture.componentInstance.checked.set(checked);
  fixture.detectChanges();
  return fixture;
}

describe('BreakRowItem', () => {
  it('種別ラベルと本文ラベルを表示し、チェックで toggled を発火する', () => {
    const fixture = render({
      block: block({ id: 'f0b0', kind: 'table', label: '機能 状態' }),
      depth: 1,
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('表');
    expect(el.textContent).toContain('機能 状態');
    el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    expect(fixture.componentInstance.toggles).toBe(1);
  });

  it('checked 入力がチェック状態に反映される', () => {
    const fixture = render({ block: block({ id: 'f0b0', kind: 'paragraph' }), depth: 1 }, true);
    const checkbox = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(checkbox!.checked).toBe(true);
  });

  it('階層深さがインデント幅になり、上限で頭打ちになる', () => {
    const shallow = render({ block: block({ id: 'f0b0', kind: 'paragraph' }), depth: 2 });
    expect(shallow.nativeElement.querySelector('label').style.paddingLeft).toBe('18px');
    const deep = render({ block: block({ id: 'f0b1', kind: 'paragraph' }), depth: 9 });
    expect(deep.nativeElement.querySelector('label').style.paddingLeft).toBe('54px');
  });

  it('h1/h2 の見出しだけを強調する', () => {
    const h2 = render({ block: block({ id: 'f0b0', kind: 'heading', level: 2 }), depth: 2 });
    expect(h2.nativeElement.querySelector('.font-medium')).not.toBeNull();
    const h3 = render({ block: block({ id: 'f0b1', kind: 'heading', level: 3 }), depth: 3 });
    expect(h3.nativeElement.querySelector('.font-medium')).toBeNull();
  });

  it('ファイル境界ブロックはチェックの無い案内表示になる', () => {
    const fixture = render({
      block: block({ id: 'f1b0', kind: 'heading', level: 1, isFileBoundary: true }),
      depth: 1,
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
    expect(el.textContent).toContain('ファイル境界、常に改ページ');
  });
});
