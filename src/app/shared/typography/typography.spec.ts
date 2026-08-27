import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SIZES } from './font-catalog';
import { Typography } from './typography';

const NEXT = SIZES.next(SIZES.initial, 1);

describe('Typography', () => {
  it('既定の文字サイズを保有する', () => {
    expect(TestBed.inject(Typography).size()).toBe(SIZES.initial);
  });

  it('隣の文字サイズへ変える', () => {
    const typography = TestBed.inject(Typography);
    typography.changeBy(1);
    expect(typography.size()).toBe(NEXT);
  });

  it('現在の文字サイズを画面 CSS へ反映する', () => {
    TestBed.inject(Typography);
    TestBed.tick();
    const value = document.documentElement.style.getPropertyValue('--base-font-size');
    expect(value).toBe(`${SIZES.initial.pt}pt`);
  });

  it('変えると反映も追随する', () => {
    TestBed.inject(Typography).changeBy(1);
    TestBed.tick();
    const value = document.documentElement.style.getPropertyValue('--base-font-size');
    expect(value).toBe(`${NEXT.pt}pt`);
  });
});
