import { describe, expect, it } from 'vitest';
import { FragmentCache } from './fragment-cache';
import type { ManuscriptFile } from './manuscript';

function file(content: string, name = 'a.md'): ManuscriptFile {
  return { id: 1, name, content };
}

describe('FragmentCache.begin', () => {
  it('呼ぶたびに増える世代番号を返す', () => {
    const cache = new FragmentCache();
    expect(cache.begin()).toBe(1);
    expect(cache.begin()).toBe(2);
  });
});

describe('FragmentCache.isCached / put', () => {
  it('put していない内容は未キャッシュ', () => {
    const cache = new FragmentCache();
    expect(cache.isCached('# A')).toBe(false);
  });

  it('put した内容はキャッシュ済みになる', () => {
    const cache = new FragmentCache();
    cache.put('# A', '<h1>A</h1>');
    expect(cache.isCached('# A')).toBe(true);
  });
});

describe('FragmentCache.fragmentFor', () => {
  it('未キャッシュの内容は html が空文字になる', () => {
    const cache = new FragmentCache();
    const fragment = cache.fragmentFor(file('# A'), 0);
    expect(fragment).toEqual({ fileIndex: 0, fileName: 'a.md', html: '' });
  });

  it('キャッシュ済みの内容は保存した html を返す', () => {
    const cache = new FragmentCache();
    cache.put('# A', '<h1>A</h1>');
    const fragment = cache.fragmentFor(file('# A'), 2);
    expect(fragment).toEqual({ fileIndex: 2, fileName: 'a.md', html: '<h1>A</h1>' });
  });
});

describe('FragmentCache.evict', () => {
  it('世代が古い場合は何も追い出さない', () => {
    const cache = new FragmentCache();
    const epoch = cache.begin();
    cache.put('# A', '<h1>A</h1>');
    cache.begin();
    cache.evict(epoch, new Set());
    expect(cache.isCached('# A')).toBe(true);
  });

  it('最新世代なら keep に無いエントリを追い出す', () => {
    const cache = new FragmentCache();
    const epoch = cache.begin();
    cache.put('# A', '<h1>A</h1>');
    cache.put('# B', '<h1>B</h1>');
    cache.evict(epoch, new Set(['# A']));
    expect(cache.isCached('# A')).toBe(true);
    expect(cache.isCached('# B')).toBe(false);
  });
});
