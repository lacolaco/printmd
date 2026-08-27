import { describe, expect, it } from 'vitest';
import { SIZES } from './font-catalog';

describe('font-catalog', () => {
  it('段は小さい順に並ぶ', () => {
    const points = SIZES.sizes.map((size) => size.pt);
    expect(points).toEqual([...points].sort((a, b) => a - b));
  });

  it('どの段も正の寸法と表示名を持つ', () => {
    SIZES.sizes.forEach((size) => {
      expect(size.pt).toBeGreaterThan(0);
      expect(size.label).not.toBe('');
    });
  });

  it('表示名は段を一意に指す', () => {
    const labels = SIZES.sizes.map((size) => size.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('既定は一覧の中にある', () => {
    expect(SIZES.sizes).toContain(SIZES.initial);
  });

  it('既定は両端ではない (どちらへも送れる)', () => {
    expect(SIZES.isChangeable(SIZES.initial, -1)).toBe(true);
    expect(SIZES.isChangeable(SIZES.initial, 1)).toBe(true);
  });
});
