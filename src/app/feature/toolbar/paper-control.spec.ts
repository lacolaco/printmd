import { Component, model } from '@angular/core';
import { Toolbar } from '@angular/aria/toolbar';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { PaperControl } from './paper-control';

/** PaperControl は ngToolbar 配下の widget を前提とするため、帯を模した host で包んで検証する */
@Component({
  imports: [PaperControl, Toolbar],
  template: `
    <div ngToolbar aria-label="表示設定">
      <app-paper-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = model.required<PaperFormat>();
}

async function render(selected: PaperFormat) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = [...el.querySelectorAll<HTMLButtonElement>('[ngToolbarWidgetGroup] button')];
  return { fixture, el, buttons };
}

describe('PaperControl', () => {
  it('選べる書式をボタンで並べる', async () => {
    const { buttons } = await render(PAPERS[0]);
    const labels = buttons.map((button) => button.textContent?.trim());
    expect(labels).toEqual(PAPERS.map((paper) => paper.label));
  });

  it('選べる書式に role="radio" は付けない (矢印キーで選択は動かないため)', async () => {
    const { buttons } = await render(PAPERS[0]);
    expect(buttons.every((button) => button.getAttribute('role') !== 'radio')).toBe(true);
  });

  it('どの書式でも選択状態が aria-pressed に表れる', async () => {
    for (const paper of PAPERS) {
      const { buttons } = await render(paper);
      const pressed = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true');
      expect(pressed).toHaveLength(1);
      expect(pressed[0].textContent?.trim()).toBe(paper.label);
    }
  });

  it('クリックで選び直すとその書式を返す', async () => {
    const other = PAPERS[PAPERS.length - 1];
    const { fixture, buttons } = await render(PAPERS[0]);
    buttons[buttons.length - 1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(other);
  });

  it('インスタンスごとに label の id が異なる (複数描画しても参照が衝突しない)', async () => {
    const { fixture: a } = await render(PAPERS[0]);
    const { fixture: b } = await render(PAPERS[0]);
    const idOf = (fixture: typeof a) =>
      (fixture.nativeElement as HTMLElement).querySelector('span')!.id;
    expect(idOf(a)).not.toBe(idOf(b));
  });
});
