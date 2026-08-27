import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { PaperControl } from './paper-control';

async function render(selected: PaperFormat) {
  const fixture = TestBed.createComponent(PaperControl);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  await fixture.whenStable();
  const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
  return { fixture, select };
}

describe('PaperControl', () => {
  it('選べる書式を一覧で並べる', async () => {
    const { select } = await render(PAPERS[0]);
    const labels = [...select.options].map((option) => option.textContent?.trim());
    expect(labels).toEqual(PAPERS.map((paper) => paper.label));
  });

  it('どの書式でも選択状態で表示される', async () => {
    for (const paper of PAPERS) {
      expect((await render(paper)).select.value).toBe(paper.label);
    }
  });

  it('選び直すとその書式を返す', async () => {
    const other = PAPERS[PAPERS.length - 1];
    const { fixture, select } = await render(PAPERS[0]);
    select.value = other.label;
    select.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(other);
  });
});
