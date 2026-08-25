import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PAPERS } from '../../shared/paper/paper-catalog';
import { PaperControl } from './paper-control';

function renderWith(current: string): HTMLSelectElement {
  const fixture = TestBed.createComponent(PaperControl);
  fixture.componentRef.setInput('choices', PAPERS);
  fixture.componentRef.setInput('current', current);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelector('select')!;
}

describe('PaperControl', () => {
  it('選べる書式を一覧で並べる', () => {
    const select = renderWith('a4');
    expect([...select.options].map((option) => option.value)).toEqual(['a4', 'a3', 'b5']);
  });

  it('現在の書式が選択状態で表示される (再構築されても同じ)', () => {
    expect(renderWith('b5').value).toBe('b5');
    expect(renderWith('a3').selectedIndex).toBe(1);
  });
});
