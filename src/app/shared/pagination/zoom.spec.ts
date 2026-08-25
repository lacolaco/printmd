import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A4 } from '../paper/paper-catalog';
import { Paper } from '../paper/paper';
import { PaperFormat } from '../paper/paper-format';
import { mm } from '../paper/units';
import { ZOOMS, Zoom, defaultZoomIndex } from './zoom';

/** A4 より大きい紙。カタログに何が並んでいても成り立たせるためこの場で組む */
const LARGE = new PaperFormat('大', { width: mm(297), height: mm(420), margin: mm(20) });

describe('defaultZoomIndex', () => {
  it('広い画面では 100% (実寸) を上限とする', () => {
    expect(ZOOMS[defaultZoomIndex(2000, true, A4)]).toBe(1);
  });

  it('A4 実寸が収まらない幅では収まる最大の段へ縮小する', () => {
    // 1100 - 360 - 48 = 692px < A4 794px → 75% (596px) が収まる最大
    expect(ZOOMS[defaultZoomIndex(1100, true, A4)]).toBe(0.75);
  });

  it('スマートフォン幅では 50% まで下げる', () => {
    expect(ZOOMS[defaultZoomIndex(390, false, A4)]).toBe(0.5);
  });

  it('どれも収まらない極端な幅でも最小段で止まる', () => {
    expect(ZOOMS[defaultZoomIndex(200, false, A4)]).toBe(0.5);
  });
});

describe('紙の大きさと段', () => {
  it('同じ幅でも紙が大きい書式ではより小さい段を選ぶ', () => {
    expect(ZOOMS[defaultZoomIndex(1000, false, A4)]).toBe(1);
    expect(ZOOMS[defaultZoomIndex(1000, false, LARGE)]).toBe(0.75);
  });
});

/** jsdom には matchMedia が無いので差し込む (初期段は matchMedia と innerWidth で決まる) */
function stubMatchMedia(isSideColumnShown: boolean): void {
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: isSideColumnShown, media }));
}

describe('Zoom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('書式を選び直すと段送りを捨て、その紙が収まる段へ組み直す', () => {
    stubMatchMedia(false);
    const zoom = TestBed.inject(Zoom);
    // 可用幅 976px: A4 (794px) は収まり、大 (1122px) は収まらない
    expect(ZOOMS[zoom.index()]).toBe(1);
    zoom.stepBy(1);
    TestBed.inject(Paper).select(LARGE);
    expect(ZOOMS[zoom.index()]).toBe(0.75);
  });
});
