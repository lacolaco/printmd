import { TestBed } from '@angular/core/testing';
import { DOCUMENT, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { StyleVariables } from './style-variables';

function inDocument() {
  const doc = document.implementation.createHTMLDocument('a');
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: doc }] });
  return { doc, variables: TestBed.inject(StyleVariables) };
}

describe('StyleVariables', () => {
  it('登録が無ければ何も書かない', () => {
    const { doc, variables } = inDocument();
    TestBed.tick();
    expect(variables.all()).toEqual([]);
    expect(doc.documentElement.style.length).toBe(0);
  });

  it('登録した設定のカスタムプロパティを html へ書く', () => {
    const { doc, variables } = inDocument();
    variables.register(() => [['--a', '1mm']]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('1mm');
  });

  it('複数の設定を登録の順にまとめる', () => {
    const { variables } = inDocument();
    variables.register(() => [['--a', '1mm']]);
    variables.register(() => [['--b', '2pt']]);
    expect(variables.all()).toEqual([
      ['--a', '1mm'],
      ['--b', '2pt'],
    ]);
  });

  it('設定の値が変われば書き直す', () => {
    const size = signal('9pt');
    const { doc, variables } = inDocument();
    variables.register(() => [['--a', size()]]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('9pt');

    size.set('14pt');
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('14pt');
  });

  it('返さなくなった名前を削除する', () => {
    const supplied = signal(true);
    const { doc, variables } = inDocument();
    variables.register(() => (supplied() ? [['--a', '1mm']] : []));
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('1mm');

    supplied.set(false);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('');
  });
});
