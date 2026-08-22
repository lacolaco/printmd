import { describe, expect, it } from 'vitest';
import { ZOOMS, defaultZoomIndex } from './viewer-state';

describe('defaultZoomIndex', () => {
  it('広い画面では 100% (実寸) を上限とする', () => {
    expect(ZOOMS[defaultZoomIndex(2000, true)]).toBe(1);
  });

  it('A4 実寸が収まらない幅では収まる最大の段へ縮小する', () => {
    // 1100 - 360 - 48 = 692px < A4 794px → 75% (596px) が収まる最大
    expect(ZOOMS[defaultZoomIndex(1100, true)]).toBe(0.75);
  });

  it('スマートフォン幅では 50% まで下げる', () => {
    expect(ZOOMS[defaultZoomIndex(390, false)]).toBe(0.5);
  });

  it('どれも収まらない極端な幅でも最小段で止まる', () => {
    expect(ZOOMS[defaultZoomIndex(200, false)]).toBe(0.5);
  });
});
