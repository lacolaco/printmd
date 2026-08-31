import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FileRowItem } from './file-row-item';
import { Direction } from '../../../shared/support/direction';

@Component({
  imports: [FileRowItem],
  template: `<app-file-row-item
    [file]="{ id: 1, name: 'a.md', content: '' }"
    [isFirst]="first()"
    [isLast]="last()"
    (moved)="moves.push($event)"
    (removed)="removes = removes + 1"
  />`,
})
class Host {
  readonly first = signal(false);
  readonly last = signal(false);
  readonly moves: number[] = [];
  removes = 0;
}

describe('FileRowItem', () => {
  function render(first = false, last = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.first.set(first);
    fixture.componentInstance.last.set(last);
    fixture.detectChanges();
    return fixture;
  }

  it('ファイル名を表示し、上下移動と削除を通知する', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('a.md');
    el.querySelector<HTMLButtonElement>(`[data-move-dir="${Direction.Backward}"]`)!.click();
    el.querySelector<HTMLButtonElement>(`[data-move-dir="${Direction.Forward}"]`)!.click();
    expect(fixture.componentInstance.moves).toEqual([-1, 1]);
    el.querySelector<HTMLButtonElement>('[aria-label="a.mdを取り除く"]')!.click();
    expect(fixture.componentInstance.removes).toBe(1);
  });

  it('先頭では上へ、末尾では下へのボタンが無効になる', () => {
    const first = render(true, false).nativeElement as HTMLElement;
    expect(
      first.querySelector<HTMLButtonElement>(`[data-move-dir="${Direction.Backward}"]`)!.disabled,
    ).toBe(true);
    expect(
      first.querySelector<HTMLButtonElement>(`[data-move-dir="${Direction.Forward}"]`)!.disabled,
    ).toBe(false);
    const last = render(false, true).nativeElement as HTMLElement;
    expect(
      last.querySelector<HTMLButtonElement>(`[data-move-dir="${Direction.Forward}"]`)!.disabled,
    ).toBe(true);
  });
});
