import { describe, expect, it } from 'vitest';
import { PickedFile, sourcesFrom } from './import-source';

describe('PickedFile', () => {
  it('File の name をそのまま返す', () => {
    const picked = new PickedFile(new File(['# A'], 'a.md'));
    expect(picked.name).toBe('a.md');
  });

  it('text() は File の内容を読み出す', async () => {
    const picked = new PickedFile(new File(['# A'], 'a.md'));
    await expect(picked.text()).resolves.toBe('# A');
  });
});

describe('sourcesFrom', () => {
  it('null からは空配列を返す', () => {
    expect(sourcesFrom(null)).toEqual([]);
  });

  it('undefined からは空配列を返す', () => {
    expect(sourcesFrom(undefined)).toEqual([]);
  });

  it('FileList の各要素を ImportSource として包む', () => {
    const files = [new File(['# A'], 'a.md'), new File(['# B'], 'b.md')] as unknown as FileList;
    const sources = sourcesFrom(files);
    expect(sources.map((s) => s.name)).toEqual(['a.md', 'b.md']);
  });
});
