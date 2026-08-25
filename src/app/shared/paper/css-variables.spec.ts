import { describe, expect, it } from 'vitest';
import { A3, B5 } from './paper-catalog';
import { CssVariables } from './css-variables';

describe('CssVariables', () => {
  it('書式の寸法を html のカスタムプロパティへ書く', () => {
    new CssVariables(document).apply(B5);
    const { style } = document.documentElement;
    expect(style.getPropertyValue('--page-width')).toBe('182mm');
    expect(style.getPropertyValue('--content-height')).toBe('229mm');
  });

  it('書式を変えると上書きされる', () => {
    const variables = new CssVariables(document);
    variables.apply(B5);
    variables.apply(A3);
    expect(document.documentElement.style.getPropertyValue('--page-width')).toBe('297mm');
  });
});
