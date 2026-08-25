import { describe, expect, it } from 'vitest';
import { A4 } from './paper-catalog';
import { CssVariables } from './css-variables';

describe('CssVariables', () => {
  it('書式の寸法を html のカスタムプロパティへ書く', () => {
    const doc = document.implementation.createHTMLDocument('a');
    new CssVariables(doc).apply(A4);
    const { style } = doc.documentElement;
    expect(style.getPropertyValue('--page-width')).toBe('210mm');
    expect(style.getPropertyValue('--content-height')).toBe('265mm');
    expect(style.getPropertyValue('--column-gap')).toBe('16mm');
  });
});
