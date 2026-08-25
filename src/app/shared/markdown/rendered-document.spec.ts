import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from './block-extractor';

const doc = () =>
  buildRenderedDocument([
    { fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p><p>a2</p>' },
    { fileIndex: 1, fileName: 'b.md', html: '<h1>B</h1><p>b1</p>' },
  ]);

describe('RenderedDocument', () => {
  describe('mount', () => {
    it('host へ自身の container を追加する', () => {
      const document_ = doc();
      const host = document.createElement('div');
      document_.mount(host, new Set());
      expect(host.contains(document_.container)).toBe(true);
    });

    it('強制改ページ (ファイル境界と指定 ID) をクラスとして反映する', () => {
      const document_ = doc();
      const host = document.createElement('div');
      document_.mount(host, new Set(['f0b1']));
      const children = [...document_.container.children];
      expect(children.map((el) => el.classList.contains('forced-break'))).toEqual([
        false,
        true,
        false,
        true,
        false,
      ]);
    });
  });

  describe('markBreaks', () => {
    it('冪等である (繰り返し適用しても結果は変わらない)', () => {
      const document_ = doc();
      document_.markBreaks(new Set(['f0b1']));
      const before = [...document_.container.children].map((el) =>
        el.classList.contains('forced-break'),
      );
      document_.markBreaks(new Set(['f0b1']));
      const after = [...document_.container.children].map((el) =>
        el.classList.contains('forced-break'),
      );
      expect(after).toEqual(before);
    });

    it('指定を変えれば toggle として反映し直す', () => {
      const document_ = doc();
      document_.markBreaks(new Set(['f0b1']));
      expect(document_.container.children[1].classList.contains('forced-break')).toBe(true);
      document_.markBreaks(new Set());
      expect(document_.container.children[1].classList.contains('forced-break')).toBe(false);
    });
  });

  describe('groups', () => {
    it('同一参照を返す (遅延メモ)', () => {
      const document_ = doc();
      expect(document_.groups()).toBe(document_.groups());
    });

    it('ファイルごとの行を持つ', () => {
      const document_ = doc();
      expect(document_.groups().map((g) => g.fileName)).toEqual(['a.md', 'b.md']);
    });
  });

  describe('rowTotal', () => {
    it('全ファイルの行数の合計を返す', () => {
      expect(doc().rowTotal()).toBe(5);
    });
  });

  describe('isMultiSource', () => {
    it('複数ファイル由来なら true', () => {
      expect(doc().isMultiSource()).toBe(true);
    });

    it('単一ファイル由来なら false', () => {
      const single = buildRenderedDocument([{ fileIndex: 0, fileName: 'a.md', html: '<p>a</p>' }]);
      expect(single.isMultiSource()).toBe(false);
    });
  });
});
