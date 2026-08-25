import { describe, expect, it } from 'vitest';
import { mm, px, toPx } from './units';

describe('units', () => {
  it('mm を 96dpi 基準で CSS px へ換算する', () => {
    expect(toPx(mm(25.4))).toBe(96);
    expect(toPx(mm(210))).toBeCloseTo(793.7, 1);
  });

  it('単位を付けても値は変わらない', () => {
    expect(mm(16)).toBe(16);
    expect(px(96)).toBe(96);
  });
});
