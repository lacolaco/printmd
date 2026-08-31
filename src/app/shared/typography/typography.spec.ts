import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FONT_SIZE, Typography } from './typography';
import { Direction } from '../support/direction';

function readVariable(): string {
  return document.documentElement.style.getPropertyValue('--base-font-size');
}

describe('Typography', () => {
  it('既定は 16px と同じ寸法である', () => {
    expect(TestBed.inject(Typography).size()).toBe(12);
  });

  it('刻みぶん動く', () => {
    const typography = TestBed.inject(Typography);
    const before = typography.size();
    typography.changeBy(Direction.Forward);
    expect(typography.size()).toBe(before + FONT_SIZE.step);
    typography.changeBy(Direction.Backward);
    expect(typography.size()).toBe(before);
  });

  it('下限と上限で頭打ちになる', () => {
    const typography = TestBed.inject(Typography);
    typography.size.set(FONT_SIZE.min);
    typography.changeBy(Direction.Backward);
    expect(typography.size()).toBe(FONT_SIZE.min);
    expect(typography.isChangeable(Direction.Backward)).toBe(false);

    typography.size.set(FONT_SIZE.max);
    typography.changeBy(Direction.Forward);
    expect(typography.size()).toBe(FONT_SIZE.max);
    expect(typography.isChangeable(Direction.Forward)).toBe(false);
  });

  it('刻みに乗らない値からも動ける', () => {
    const typography = TestBed.inject(Typography);
    typography.size.set(10.3);
    typography.changeBy(Direction.Forward);
    expect(typography.size()).toBe(10.8);
  });

  it('範囲の外を書き込んでも内側へ戻せる', () => {
    const typography = TestBed.inject(Typography);
    typography.size.set(FONT_SIZE.max + 10);
    typography.changeBy(Direction.Backward);
    expect(typography.size()).toBe(FONT_SIZE.max);
  });

  it('現在の文字サイズを画面 CSS へ反映する', () => {
    TestBed.inject(Typography);
    TestBed.tick();
    expect(readVariable()).toBe('12pt');
  });

  it('変えると反映も追随する', () => {
    TestBed.inject(Typography).changeBy(Direction.Forward);
    TestBed.tick();
    expect(readVariable()).toBe(`${12 + FONT_SIZE.step}pt`);
  });
});
