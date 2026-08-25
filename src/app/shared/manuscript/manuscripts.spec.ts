import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Manuscripts } from './manuscripts';

function file(name: string, content: string) {
  return { name, text: () => Promise.resolve(content) };
}

describe('Manuscripts', () => {
  let manuscripts: Manuscripts;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    manuscripts = TestBed.inject(Manuscripts);
  });

  it('初期状態はファイルなし・警告なし', () => {
    expect(manuscripts.files()).toEqual([]);
    expect(manuscripts.warnings()).toEqual([]);
    expect(manuscripts.isNonEmpty()).toBe(false);
  });

  describe('add', () => {
    it('取り込んだファイルを末尾へ追加する', async () => {
      await manuscripts.add([file('a.md', '# A')]);
      await manuscripts.add([file('b.md', '# B')]);
      expect(manuscripts.files().map((f) => f.name)).toEqual(['a.md', 'b.md']);
      expect(manuscripts.isNonEmpty()).toBe(true);
    });

    it('警告は直近の取り込み分で上書きする', async () => {
      await manuscripts.add([file('image.png', 'dummy')]);
      expect(manuscripts.warnings().length).toBeGreaterThan(0);
      await manuscripts.add([file('a.md', '# A')]);
      expect(manuscripts.warnings()).toEqual([]);
    });

    it('空配列を渡しても何も追加しない', async () => {
      await manuscripts.add([]);
      expect(manuscripts.files()).toEqual([]);
    });
  });

  describe('remove', () => {
    it('指定 ID の原稿を取り除く', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      const [a] = manuscripts.files();
      manuscripts.remove(a.id);
      expect(manuscripts.files().map((f) => f.name)).toEqual(['b.md']);
    });

    it('存在しない ID では何もしない', async () => {
      await manuscripts.add([file('a.md', '# A')]);
      const before = manuscripts.files();
      manuscripts.remove(9999);
      expect(manuscripts.files()).toBe(before);
    });
  });

  describe('isMovable / isReorderable', () => {
    it('先頭は前方向へ動かせない', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      const [a] = manuscripts.files();
      expect(manuscripts.isMovable(a.id, -1)).toBe(false);
    });

    it('中間の要素はどちらの方向にも動かせる', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B'), file('c.md', '# C')]);
      const [, b] = manuscripts.files();
      expect(manuscripts.isMovable(b.id, -1)).toBe(true);
      expect(manuscripts.isMovable(b.id, 1)).toBe(true);
    });

    it('位置が変わる並べ替えは isReorderable が true を返す', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      expect(manuscripts.isReorderable(0, 1)).toBe(true);
    });

    it('同じ位置への並べ替えは isReorderable が false を返す', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      expect(manuscripts.isReorderable(0, 0)).toBe(false);
    });
  });

  describe('nudge / reorder', () => {
    it('nudge は指定 ID を delta 方向へ 1 つ動かす', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      const [a] = manuscripts.files();
      manuscripts.nudge(a.id, 1);
      expect(manuscripts.files().map((f) => f.name)).toEqual(['b.md', 'a.md']);
    });

    it('reorder は from の原稿を to へ動かす', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B'), file('c.md', '# C')]);
      manuscripts.reorder(0, 2);
      expect(manuscripts.files().map((f) => f.name)).toEqual(['b.md', 'c.md', 'a.md']);
    });

    it('位置が変わらない reorder では同じ配列参照を保つ', async () => {
      await manuscripts.add([file('a.md', '# A'), file('b.md', '# B')]);
      const before = manuscripts.files();
      manuscripts.reorder(0, 0);
      expect(manuscripts.files()).toBe(before);
    });
  });

  describe('isNonEmpty', () => {
    it('ファイルが 1 つでもあれば true', async () => {
      await manuscripts.add([file('a.md', '# A')]);
      expect(manuscripts.isNonEmpty()).toBe(true);
    });
  });

  describe('warnings', () => {
    it('Markdown 以外の取り込みで警告文を保持する', async () => {
      await manuscripts.add([file('image.png', 'dummy')]);
      expect(manuscripts.warnings().length).toBeGreaterThan(0);
    });
  });
});
