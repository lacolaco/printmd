import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAPER, PAPERS } from './paper-catalog';
import { Paper } from './paper';
import { StyleVariables } from '../layout/style-variables';

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

  it('現在の書式を @page 規則へ反映する', () => {
    TestBed.inject(Paper);
    TestBed.tick();
    const rule = document.head.querySelector('style[data-paper-page-rule]')?.textContent;
    expect(rule).toContain(`size: ${DEFAULT_PAPER.page.width}mm`);
  });

  it('選び直すと @page 規則も追随する', () => {
    const paper = TestBed.inject(Paper);
    paper.select(LAST);
    TestBed.tick();
    const rule = document.head.querySelector('style[data-paper-page-rule]')?.textContent;
    expect(rule).toContain(`size: ${LAST.page.width}mm`);
  });
});

describe('Paper の登録', () => {
  it('紙面の寸法を画面 CSS へ渡す設定として自分を登録する', () => {
    const paper = TestBed.inject(Paper);
    paper.select(LAST);
    expect(TestBed.inject(StyleVariables).all()).toEqual(LAST.variables());
  });
});
