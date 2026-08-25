import { describe, expect, it } from 'vitest';
import { ifDefined } from './optional';

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
