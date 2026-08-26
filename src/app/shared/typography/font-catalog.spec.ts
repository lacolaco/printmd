import { describe, expect, it } from 'vitest';
import { DEFAULT_SIZE, SIZES, isSteppable, steppedFrom } from './font-catalog';

describe('font-catalog', () => {
  it('段は昇順で並ぶ', () => {
    expect(SIZES.map((size) => size.pt)).toEqual([9, 10, 10.5, 11, 12, 14]);
  });

  it('既定は 12pt', () => {
    expect(DEFAULT_SIZE.pt).toBe(12);
  });
});

describe('steppedFrom', () => {
  it('delta ぶん隣の段へ進む', () => {
    expect(steppedFrom(DEFAULT_SIZE, 1).pt).toBe(14);
    expect(steppedFrom(DEFAULT_SIZE, -1).pt).toBe(11);
  });

  it('両端では頭打ちになる', () => {
    expect(steppedFrom(SIZES[0], -1)).toBe(SIZES[0]);
    expect(steppedFrom(SIZES[SIZES.length - 1], 1)).toBe(SIZES[SIZES.length - 1]);
  });
});

describe('isSteppable', () => {
  it('両端でだけ送れない', () => {
    expect(isSteppable(SIZES[0], -1)).toBe(false);
    expect(isSteppable(SIZES[0], 1)).toBe(true);
    expect(isSteppable(SIZES[SIZES.length - 1], 1)).toBe(false);
  });
});
