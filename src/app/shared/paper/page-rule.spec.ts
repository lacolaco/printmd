import { describe, expect, it } from 'vitest';
import { A4 } from './paper-catalog';
import { PageRule } from './page-rule';

function rules(doc: Document): NodeListOf<HTMLStyleElement> {
  return doc.head.querySelectorAll('style[data-paper-page-rule]');
}

describe('PageRule', () => {
  it('@page 規則を書式の実寸で書く', () => {
    const doc = document.implementation.createHTMLDocument('a');
    new PageRule(doc).apply(A4);
    expect(rules(doc)[0].textContent).toBe('@page { size: 210mm 297mm; margin: 16mm; }');
  });

  it('繰り返し適用しても規則を載せる要素は 1 つだけ', () => {
    const doc = document.implementation.createHTMLDocument('b');
    const rule = new PageRule(doc);
    rule.apply(A4);
    rule.apply(A4);
    expect(rules(doc).length).toBe(1);
  });
});
