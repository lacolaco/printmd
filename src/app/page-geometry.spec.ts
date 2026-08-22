import { describe, expect, it } from 'vitest';
import {
  CONTENT_HEIGHT_MM,
  CONTENT_WIDTH_MM,
  COLUMN_STEP_MM,
  PAGE_HEIGHT_MM,
  PAGE_MARGIN_MM,
  PAGE_WIDTH_MM,
  applyPageGeometryCssVariables,
} from './page-geometry';

describe('page-geometry', () => {
  it('版面は紙寸法から余白を引いた導出値である', () => {
    expect(CONTENT_WIDTH_MM).toBe(PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2);
    expect(CONTENT_HEIGHT_MM).toBe(PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2);
    expect(COLUMN_STEP_MM).toBe(194);
  });

  it('CSS カスタムプロパティとして注入できる', () => {
    const el = document.createElement('div');
    applyPageGeometryCssVariables(el);
    expect(el.style.getPropertyValue('--content-width')).toBe('178mm');
    expect(el.style.getPropertyValue('--page-height')).toBe('297mm');
  });
});
