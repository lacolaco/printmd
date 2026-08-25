import { describe, expect, it } from 'vitest';
import { A4 } from './paper-catalog';
import { PaperStyles } from './paper-styles';

describe('PaperStyles', () => {
  it('画面 CSS と @page 規則の双方へ同じ書式を反映する', () => {
    const doc = document.implementation.createHTMLDocument('styles');
    new PaperStyles(doc).apply(A4);
    expect(doc.documentElement.style.getPropertyValue('--page-width')).toBe('210mm');
    expect(doc.head.querySelector('style[data-paper-page-rule]')?.textContent).toContain(
      'size: 210mm 297mm',
    );
  });
});
