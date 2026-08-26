import { describe, expect, it } from 'vitest';
import { isActivating, preventSelection } from './toolbar-activation';

function keydown(key: string, repeat = false): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, repeat, cancelable: true });
}

describe('preventSelection', () => {
  it('Enter / Space の既定動作を止める', () => {
    const enter = keydown('Enter');
    preventSelection(enter);
    expect(enter.defaultPrevented).toBe(true);

    const space = keydown(' ');
    preventSelection(space);
    expect(space.defaultPrevented).toBe(true);
  });

  it('それ以外のキーは止めない', () => {
    const tab = keydown('Tab');
    preventSelection(tab);
    expect(tab.defaultPrevented).toBe(false);
  });
});

describe('isActivating', () => {
  it('Enter / Space の押下 (repeat でない) を発火対象とする', () => {
    expect(isActivating(keydown('Enter'))).toBe(true);
    expect(isActivating(keydown(' '))).toBe(true);
  });

  it('repeat は発火対象にしない', () => {
    expect(isActivating(keydown('Enter', true))).toBe(false);
  });

  it('それ以外のキーは発火対象にしない', () => {
    expect(isActivating(keydown('Tab'))).toBe(false);
  });
});
