import { describe, expect, it } from 'vitest';
import { hasItems } from './collections';

describe('hasItems', () => {
  it('要素があれば真', () => {
    expect(hasItems([1])).toBe(true);
  });

  it('空配列は偽', () => {
    expect(hasItems([])).toBe(false);
  });
});
