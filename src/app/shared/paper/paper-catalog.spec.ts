import { describe, expect, it } from 'vitest';
import { A4, DEFAULT_PAPER, PAPERS } from './paper-catalog';

describe('paper-catalog', () => {
  it('A4 の紙寸法と余白', () => {
    expect(A4.page).toEqual({ width: 210, height: 297, margin: 16 });
    expect(A4.label).toBe('A4');
  });

  it('選べる書式を画面に並べる順で持ち、既定は A4', () => {
    expect(PAPERS.map((paper) => paper.label)).toEqual(['A4']);
    expect(DEFAULT_PAPER).toBe(A4);
  });
});
