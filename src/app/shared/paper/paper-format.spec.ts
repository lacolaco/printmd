import { describe, expect, it } from 'vitest';
import { PaperFormat } from './paper-format';
import { mm, px, toPx } from './units';

const paper = new PaperFormat('A4', { width: mm(210), height: mm(297), margin: mm(16) });

describe('PaperFormat', () => {
  it('版面は紙寸法から余白を引いた導出値である', () => {
    expect(paper.content).toEqual({ width: 178, height: 265 });
  });

  it('段の刻みは版面幅と段間の和である', () => {
    expect(paper.step).toBe(paper.content.width + paper.gap);
    expect(paper.offsetAt(2)).toBe(388);
  });

  it('段組ストリップの幅を段数へ丸める (最低 1 段)', () => {
    expect(paper.pagesIn(px(toPx(mm(paper.step * 2 - paper.gap))))).toBe(2);
    expect(paper.pagesIn(px(0))).toBe(1);
  });

  it('紙の実寸を CSS px で答える', () => {
    expect(paper.widthPx()).toBeCloseTo(toPx(mm(210)));
  });

  it('画面 CSS のカスタムプロパティを mm 付きで並べる', () => {
    expect(paper.variables()).toContainEqual(['--content-width', '178mm']);
    expect(paper.variables()).toContainEqual(['--page-height', '297mm']);
    expect(paper.variables()).toContainEqual(['--column-gap', '16mm']);
  });
});
