import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SIZES } from './font-catalog';
import { StyleVariables } from '../layout/style-variables';
import { Typography } from './typography';

describe('Typography', () => {
  it('既定の段を保有する', () => {
    expect(TestBed.inject(Typography).size()).toBe(SIZES.initial);
  });

  it('段を送る', () => {
    const typography = TestBed.inject(Typography);
    typography.changeBy(1);
    expect(typography.size()).toBe(SIZES.next(SIZES.initial, 1));
  });
});

describe('Typography の登録', () => {
  it('文字サイズを画面 CSS へ渡す設定として自分を登録する', () => {
    TestBed.inject(Typography).changeBy(1);
    expect(TestBed.inject(StyleVariables).all()).toEqual(SIZES.next(SIZES.initial, 1).variables());
  });
});
