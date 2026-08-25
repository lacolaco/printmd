import { describe, expect, it } from 'vitest';
import { A4, DEFAULT_PAPER, PAPERS } from './paper-catalog';

describe('paper-catalog', () => {
  it('A4 の紙寸法と余白', () => {
    expect(A4.page).toEqual({ width: 210, height: 297, margin: 16 });
  });

  it('どの書式も表示名と正の版面を持つ', () => {
    PAPERS.forEach((paper) => {
      expect(paper.label).not.toBe('');
      expect(paper.content.width).toBeGreaterThan(0);
      expect(paper.content.height).toBeGreaterThan(0);
    });
  });

  it('表示名は書式を一意に指す (select の値に使う)', () => {
    expect(new Set(PAPERS.map((paper) => paper.label)).size).toBe(PAPERS.length);
  });

  it('既定は一覧の先頭', () => {
    expect(DEFAULT_PAPER).toBe(PAPERS[0]);
  });
});
