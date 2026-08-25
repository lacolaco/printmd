import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { A4, B5 } from './paper-catalog';
import { Paper } from './paper';

describe('Paper', () => {
  it('既定は A4 で、id で選び直すと現在の書式が入れ替わる', () => {
    const paper = TestBed.inject(Paper);
    expect(paper.format()).toBe(A4);
    paper.selectById('b5');
    expect(paper.format()).toBe(B5);
  });

  it('未知の id は既定へ倒す', () => {
    const paper = TestBed.inject(Paper);
    paper.selectById('letter');
    expect(paper.format()).toBe(A4);
  });

  it('選べる書式を一覧で公開する', () => {
    expect(TestBed.inject(Paper).formats.map((paper) => paper.id)).toEqual(['a4', 'a3', 'b5']);
  });

  it('選んだ書式を画面 CSS へ反映する', () => {
    const paper = TestBed.inject(Paper);
    paper.selectById('b5');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('--page-width')).toBe('176mm');
  });
});
