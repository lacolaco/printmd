import { describe, expect, it } from 'vitest';
import { Steps } from './steps';

const items = ['a', 'b', 'c'];
const steps = new Steps(items, (item) => `[${item}]`);

describe('Steps', () => {
  it('delta ぶん隣の段へ進む', () => {
    expect(steps.next(items[0], 1)).toBe(items[1]);
    expect(steps.next(items[1], -1)).toBe(items[0]);
  });

  it('両端では頭打ちになる', () => {
    expect(steps.next(items[0], -1)).toBe(items[0]);
    expect(steps.next(items[items.length - 1], 1)).toBe(items[items.length - 1]);
  });

  it('両端でだけ送れない', () => {
    expect(steps.isSteppable(items[0], -1)).toBe(false);
    expect(steps.isSteppable(items[0], 1)).toBe(true);
    expect(steps.isSteppable(items[items.length - 1], 1)).toBe(false);
    expect(steps.isSteppable(items[items.length - 1], -1)).toBe(true);
  });

  it('一覧にない段は動かさない (最小段へ飛ばさない)', () => {
    expect(steps.isSteppable('z', -1)).toBe(false);
    expect(steps.isSteppable('z', 1)).toBe(false);
    expect(steps.next('z', 1)).toBe('z');
    expect(steps.next('z', -1)).toBe('z');
  });

  it('段の名前を答える', () => {
    expect(steps.nameOf(items[0])).toBe('[a]');
  });
});
