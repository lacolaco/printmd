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

  it('選んだ書式を、状態の更新と同じ手で画面 CSS へ反映する (flush を待たない)', () => {
    const paper = TestBed.inject(Paper);
    paper.selectById('a3');
    expect(document.documentElement.style.getPropertyValue('--content-width')).toBe('257mm');
  });

  it('構築した時点で既定の書式が反映されている', () => {
    TestBed.inject(Paper);
    expect(document.documentElement.style.getPropertyValue('--page-width')).toBe('210mm');
  });
});
