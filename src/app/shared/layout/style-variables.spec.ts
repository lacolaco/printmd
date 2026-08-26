import { TestBed } from '@angular/core/testing';
import { DOCUMENT, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { StyleVariables, provideLayoutSetting } from './style-variables';

function inDocument(providers: readonly unknown[]) {
  const doc = document.implementation.createHTMLDocument('a');
  TestBed.configureTestingModule({
    providers: [{ provide: DOCUMENT, useValue: doc }, ...providers],
  });
  return { doc, variables: TestBed.inject(StyleVariables) };
}

describe('StyleVariables', () => {
  it('供給元が無ければ何も書かない', () => {
    const { doc, variables } = inDocument([]);
    TestBed.tick();
    expect(variables.all()).toEqual([]);
    expect(doc.documentElement.style.length).toBe(0);
  });

  it('供給元のカスタムプロパティを html へ書く', () => {
    const { doc } = inDocument([provideLayoutSetting(() => () => [['--a', '1mm']])]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('1mm');
  });

  it('複数の供給元を束ねる (登録の順に並ぶ)', () => {
    const { variables } = inDocument([
      provideLayoutSetting(() => () => [['--a', '1mm']]),
      provideLayoutSetting(() => () => [['--b', '2pt']]),
    ]);
    expect(variables.all()).toEqual([
      ['--a', '1mm'],
      ['--b', '2pt'],
    ]);
  });

  it('供給元の値が変われば書き直す (組み上がりの依存になる)', () => {
    const size = signal('9pt');
    const { doc, variables } = inDocument([provideLayoutSetting(() => () => [['--a', size()]])]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('9pt');

    size.set('14pt');
    expect(variables.all()).toEqual([['--a', '14pt']]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('14pt');
  });

  it('供給が消えた名前は消し戻す (残って紙面に効き続けない)', () => {
    const supplied = signal(true);
    const { doc } = inDocument([
      provideLayoutSetting(() => () => (supplied() ? [['--a', '1mm']] : [])),
    ]);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('1mm');

    supplied.set(false);
    TestBed.tick();
    expect(doc.documentElement.style.getPropertyValue('--a')).toBe('');
  });
});
