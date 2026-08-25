import { describe, expect, it } from 'vitest';
import { Importer } from './importer';
import type { ImportSource } from './import-source';

function source(name: string, text: () => Promise<string>): ImportSource {
  return { name, text };
}

function ok(name: string, content: string): ImportSource {
  return source(name, () => Promise.resolve(content));
}

function failing(name: string): ImportSource {
  return source(name, () => Promise.reject(new Error('read error')));
}

describe('Importer.read', () => {
  it('Markdown 拡張子 (.md / .markdown / .txt) だけを通す', async () => {
    const importer = new Importer();
    const { files } = await importer.read([
      ok('a.md', '# A'),
      ok('b.markdown', '# B'),
      ok('c.txt', '# C'),
    ]);
    expect(files.map((f) => f.name)).toEqual(['a.md', 'b.markdown', 'c.txt']);
  });

  it('Markdown 以外の拡張子は通さず警告文を出す', async () => {
    const importer = new Importer();
    const { files, warnings } = await importer.read([ok('image.png', 'dummy')]);
    expect(files).toEqual([]);
    expect(warnings).toEqual(['Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません']);
  });

  it('text() が reject する入力は「読み込めなかったファイル」警告になる', async () => {
    const importer = new Importer();
    const { files, warnings } = await importer.read([failing('a.md')]);
    expect(files).toEqual([]);
    expect(warnings).toEqual(['読み込めなかったファイル: a.md']);
  });

  it('id は 1 から始まる連番で振られる', async () => {
    const importer = new Importer();
    const { files } = await importer.read([ok('a.md', '# A'), ok('b.md', '# B')]);
    expect(files.map((f) => f.id)).toEqual([1, 2]);
  });

  it('read を重ねても id の連番は途切れない', async () => {
    const importer = new Importer();
    await importer.read([ok('a.md', '# A')]);
    const { files } = await importer.read([ok('b.md', '# B')]);
    expect(files.map((f) => f.id)).toEqual([2]);
  });
});
