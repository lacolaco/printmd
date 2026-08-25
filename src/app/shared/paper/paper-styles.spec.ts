import { describe, expect, it } from 'vitest';
import { A3, B5 } from './paper-catalog';
import { PaperStyles } from './paper-styles';

function ruleElements(): NodeListOf<HTMLStyleElement> {
  return document.head.querySelectorAll('style[data-paper-page-rule]');
}

describe('PaperStyles', () => {
  it('別の Document を渡しても規則要素は 1 つだけ作る', () => {
    const other = document.implementation.createHTMLDocument('other');
    const styles = new PaperStyles(other);
    styles.apply(A3);
    styles.apply(B5);
    expect(other.head.querySelectorAll('style[data-paper-page-rule]').length).toBe(1);
    expect(other.documentElement.style.getPropertyValue('--page-width')).toBe('182mm');
  });

  it('書式の寸法を CSS カスタムプロパティとして注入する', () => {
    new PaperStyles(document).apply(B5);
    const { style } = document.documentElement;
    expect(style.getPropertyValue('--page-width')).toBe('182mm');
    expect(style.getPropertyValue('--content-height')).toBe('229mm');
  });

  it('印刷の @page 規則を書式の実寸で差し替える', () => {
    new PaperStyles(document).apply(A3);
    expect(ruleElements()[0].textContent).toBe(A3.pageRule());
  });

  it('適用を繰り返しても規則を載せる要素は増えない', () => {
    const styles = new PaperStyles(document);
    styles.apply(A3);
    styles.apply(B5);
    expect(ruleElements().length).toBe(1);
    expect(ruleElements()[0].textContent).toBe(B5.pageRule());
  });
});
