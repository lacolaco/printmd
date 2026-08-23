import { describe, expect, it } from 'vitest';
import { A4, applyGeometryStyles } from './page-geometry';

describe('page-geometry', () => {
  it('版面は紙寸法から余白を引いた導出値である', () => {
    expect(A4.content.width).toBe(A4.page.width - A4.page.margin * 2);
    expect(A4.content.height).toBe(A4.page.height - A4.page.margin * 2);
    expect(A4.column.step).toBe(194);
  });

  it('CSS カスタムプロパティとして注入できる', () => {
    const el = document.createElement('div');
    applyGeometryStyles(el);
    expect(el.style.getPropertyValue('--content-width')).toBe('178mm');
    expect(el.style.getPropertyValue('--page-height')).toBe('297mm');
  });
});
