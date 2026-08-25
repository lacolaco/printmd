import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAPER, PAPERS } from './paper-catalog';
import { Paper } from './paper';

/** 一覧の末尾。書式が 1 つのときは既定と同じになる */
const LAST = PAPERS[PAPERS.length - 1];

describe('Paper', () => {
  it('既定の書式を保有する', () => {
    expect(TestBed.inject(Paper).format()).toBe(DEFAULT_PAPER);
  });

  it('書式を選び直す', () => {
    const paper = TestBed.inject(Paper);
    paper.select(LAST);
    expect(paper.format()).toBe(LAST);
  });

  it('現在の書式を画面 CSS へ反映する', () => {
    TestBed.inject(Paper);
    TestBed.tick();
    const { style } = document.documentElement;
    expect(style.getPropertyValue('--page-width')).toBe(`${DEFAULT_PAPER.page.width}mm`);
    expect(style.getPropertyValue('--content-width')).toBe(`${DEFAULT_PAPER.content.width}mm`);
  });

  it('選び直すと反映も追随する', () => {
    const paper = TestBed.inject(Paper);
    paper.select(LAST);
    TestBed.tick();
    const width = document.documentElement.style.getPropertyValue('--content-width');
    expect(width).toBe(`${LAST.content.width}mm`);
  });
});
