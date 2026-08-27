import { describe, expect, it } from 'vitest';
import { FontSize } from './font-size';

describe('FontSize', () => {
  it('pt 数から表示名を導く', () => {
    expect(new FontSize(12).label).toBe('12pt');
  });

  it('小数の pt でも表示名を導く', () => {
    expect(new FontSize(10.5).label).toBe('10.5pt');
  });

  it('画面 CSS が読むカスタムプロパティを答える', () => {
    expect(new FontSize(12).variables()).toEqual([['--base-font-size', '12pt']]);
  });
});
