import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SIZE, SIZES } from './font-catalog';
import { StyleVariables } from '../layout/style-variables';
import { Typography, provideBaseFontSize } from './typography';

describe('Typography', () => {
  it('既定の段を保有する', () => {
    expect(TestBed.inject(Typography).size()).toBe(DEFAULT_SIZE);
  });

  it('段を送る', () => {
    const typography = TestBed.inject(Typography);
    typography.stepBy(1);
    expect(typography.size()).toBe(SIZES.next(DEFAULT_SIZE, 1));
  });
});

describe('provideBaseFontSize', () => {
  it('ベース文字サイズを画面 CSS の供給元として登録する', () => {
    TestBed.configureTestingModule({ providers: [provideBaseFontSize()] });
    TestBed.inject(Typography).stepBy(1);
    expect(TestBed.inject(StyleVariables).all()).toEqual(SIZES.next(DEFAULT_SIZE, 1).variables());
  });

  it('段を選び直すと供給する値も追随する', () => {
    TestBed.configureTestingModule({ providers: [provideBaseFontSize()] });
    const variables = TestBed.inject(StyleVariables);
    expect(variables.all()).toEqual(DEFAULT_SIZE.variables());
    TestBed.inject(Typography).stepBy(-1);
    expect(variables.all()).toEqual(SIZES.next(DEFAULT_SIZE, -1).variables());
  });
});
