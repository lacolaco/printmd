import { describe, expect, it } from 'vitest';
import { A3, A4, B5, FALLBACK, PAPERS } from './paper-catalog';

describe('paper-catalog', () => {
  it('3 書式を画面に並べる順で持つ', () => {
    expect(PAPERS.map((paper) => paper.id)).toEqual(['a4', 'a3', 'b5']);
    expect(PAPERS.map((paper) => paper.label)).toEqual(['A4', 'A3', 'B5']);
  });

  it('各書式の紙寸法と余白', () => {
    expect(A4.page).toEqual({ width: 210, height: 297, margin: 16 });
    expect(A3.page).toEqual({ width: 297, height: 420, margin: 20 });
    expect(B5.page).toEqual({ width: 182, height: 257, margin: 14 });
  });

  it('既定は A4', () => {
    expect(FALLBACK).toBe(A4);
  });
});
