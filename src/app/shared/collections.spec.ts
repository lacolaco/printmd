import { describe, expect, it } from 'vitest';
import { isNonEmpty, ifDefined } from './collections';

describe('isNonEmpty', () => {
  it('要素があれば真', () => {
    expect(isNonEmpty([1])).toBe(true);
  });

  it('空配列は偽', () => {
    expect(isNonEmpty([])).toBe(false);
  });
});

describe('ifDefined', () => {
  it('値があれば関数を適用する', () => {
    const seen: number[] = [];
    ifDefined(1, (v) => seen.push(v));
    expect(seen).toEqual([1]);
  });

  it('undefined なら何もしない', () => {
    const seen: number[] = [];
    ifDefined(undefined, (v: number) => seen.push(v));
    expect(seen).toEqual([]);
  });
});
