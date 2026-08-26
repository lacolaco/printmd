import { describe, expect, it } from 'vitest';
import { DEFAULT_SIZE, SIZES } from './font-catalog';

describe('font-catalog', () => {
  it('段は小さい順に並ぶ', () => {
    const points = SIZES.items.map((size) => size.pt);
    expect(points).toEqual([...points].sort((a, b) => a - b));
  });

  it('どの段も正の寸法と表示名を持つ', () => {
    SIZES.items.forEach((size) => {
      expect(size.pt).toBeGreaterThan(0);
      expect(size.label).not.toBe('');
    });
  });

  it('表示名は段を一意に指す', () => {
    const labels = SIZES.items.map((size) => size.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('既定は一覧の中にある', () => {
    expect(SIZES.items).toContain(DEFAULT_SIZE);
  });

  it('既定は両端ではない (どちらへも送れる)', () => {
    expect(SIZES.isSteppable(DEFAULT_SIZE, -1)).toBe(true);
    expect(SIZES.isSteppable(DEFAULT_SIZE, 1)).toBe(true);
  });
});
