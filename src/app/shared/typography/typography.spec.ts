import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SIZE, SIZES } from './font-catalog';
import { StyleVariables } from '../layout/style-variables';
import { Typography, provideBaseFontSize } from './typography';

/** 一覧の末尾。段が 1 つのときは既定と同じになる */
const LAST = SIZES.items[SIZES.items.length - 1];

describe('Typography', () => {
  it('既定の段を保有する', () => {
    expect(TestBed.inject(Typography).size()).toBe(DEFAULT_SIZE);
  });

  it('段を選び直す', () => {
    const typography = TestBed.inject(Typography);
    typography.select(LAST);
    expect(typography.size()).toBe(LAST);
  });
});

describe('provideBaseFontSize', () => {
  it('ベース文字サイズを画面 CSS の供給元として登録する', () => {
    TestBed.configureTestingModule({ providers: [provideBaseFontSize()] });
    TestBed.inject(Typography).select(LAST);
    expect(TestBed.inject(StyleVariables).all()).toEqual(LAST.variables());
  });

  it('段を選び直すと供給する値も追随する', () => {
    TestBed.configureTestingModule({ providers: [provideBaseFontSize()] });
    const variables = TestBed.inject(StyleVariables);
    expect(variables.all()).toEqual(DEFAULT_SIZE.variables());
    TestBed.inject(Typography).select(SIZES.items[0]);
    expect(variables.all()).toEqual(SIZES.items[0].variables());
  });
});
