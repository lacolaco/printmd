import { describe, expect, it } from 'vitest';
import { A3, B5 } from './paper-catalog';
import { PageRule } from './page-rule';

function rules(doc: Document): NodeListOf<HTMLStyleElement> {
  return doc.head.querySelectorAll('style[data-paper-page-rule]');
}

describe('PageRule', () => {
  it('@page 規則を書式の実寸で書く', () => {
    const doc = document.implementation.createHTMLDocument('a');
    new PageRule(doc).apply(A3);
    expect(rules(doc)[0].textContent).toBe(A3.pageRule());
  });

  it('書式を変えても規則を載せる要素は 1 つだけ', () => {
    const doc = document.implementation.createHTMLDocument('b');
    const rule = new PageRule(doc);
    rule.apply(A3);
    rule.apply(B5);
    expect(rules(doc).length).toBe(1);
    expect(rules(doc)[0].textContent).toBe(B5.pageRule());
  });
});
