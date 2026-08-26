import { describe, expect, it } from 'vitest';
import { isNonEmpty } from './collections';

describe('isNonEmpty', () => {
  it('要素があれば真', () => {
    expect(isNonEmpty([1])).toBe(true);
  });

  it('空配列は偽', () => {
    expect(isNonEmpty([])).toBe(false);
  });
});
