import { describe, expect, it } from 'vitest';
import { A4_MM, applyGeometryStyles } from './page-geometry';

describe('page-geometry', () => {
  it('版面は紙寸法から余白を引いた導出値である', () => {
    expect(A4_MM.content.width).toBe(A4_MM.page.width - A4_MM.page.margin * 2);
    expect(A4_MM.content.height).toBe(A4_MM.page.height - A4_MM.page.margin * 2);
    expect(A4_MM.column.step).toBe(194);
  });

  it('CSS カスタムプロパティとして注入できる', () => {
    const el = document.createElement('div');
    applyGeometryStyles(el);
    expect(el.style.getPropertyValue('--content-width')).toBe('178mm');
    expect(el.style.getPropertyValue('--page-height')).toBe('297mm');
  });
});
