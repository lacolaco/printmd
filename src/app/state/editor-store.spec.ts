import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../mermaid/mermaid-renderer';
import { EditorStore } from './editor-store';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

function file(name: string, content: string) {
  return { name, text: () => Promise.resolve(content) };
}

/**
 * resource の変換完了を待つ (renderedDocument は async 導出のため)。
 * TestBed.tick() でスケジューラを回して loader を起動させてから完了を待つ
 * (whenStable だけでは起動前に解決して素通りする)
 */
async function whenRendered(): Promise<void> {
  const appRef = TestBed.inject(ApplicationRef);
  const store = TestBed.inject(EditorStore);
  for (let i = 0; i < 50; i++) {
    TestBed.tick();
    await appRef.whenStable();
    if (!store.rendering()) return;
  }
}

describe('EditorStore', () => {
  let store: EditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorStore, { provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
    store = TestBed.inject(EditorStore);
  });

  it('初期状態はファイルなし・ブロックなし', () => {
    expect(store.files()).toEqual([]);
    expect(store.blocks()).toEqual([]);
    expect(store.hasFiles()).toBe(false);
  });

  it('Markdown ファイルを取り込みブロックを構築する', async () => {
    await store.addFiles([file('a.md', '# 見出し\n\n本文')]);
    await whenRendered();
    expect(store.files().map((f) => f.name)).toEqual(['a.md']);
    expect(store.blocks().map((b) => b.kind)).toEqual(['heading', 'paragraph']);
  });

  it('Markdown 以外の拡張子は取り込まず警告を出す', async () => {
    await store.addFiles([file('image.png', 'dummy')]);
    await whenRendered();
    expect(store.files()).toEqual([]);
    expect(store.warnings().length).toBeGreaterThan(0);
  });

  it('複数ファイルを取り込むとファイル境界のブロックが isFileBoundary になる', async () => {
    await store.addFiles([file('a.md', '# A'), file('b.md', '# B')]);
    await whenRendered();
    expect(store.blocks().map((b) => b.isFileBoundary)).toEqual([false, true]);
  });

  it('mermaid フェンスを SVG 化してブロック種別を mermaid にする', async () => {
    await store.addFiles([file('a.md', '```mermaid\ngraph TD; A-->B;\n```')]);
    await whenRendered();
    expect(store.blocks().map((b) => b.kind)).toEqual(['mermaid']);
  });

  it('ファイルを削除すると改ページ指定がリセットされる', async () => {
    await store.addFiles([file('a.md', '# A'), file('b.md', '# B')]);
    await whenRendered();
    const id = store.blocks()[0].id;
    store.toggleBreak(id);
    expect(store.breaks().has(id)).toBe(true);
    store.removeFile(store.files()[0].id);
    await whenRendered();
    expect(store.breaks().size).toBe(0);
  });

  it('ファイルを並べ替えると改ページ指定がリセットされる', async () => {
    await store.addFiles([file('a.md', '# A'), file('b.md', '# B')]);
    await whenRendered();
    store.toggleBreak(store.blocks()[0].id);
    store.moveFile(store.files()[0].id, 1);
    await whenRendered();
    expect(store.breaks().size).toBe(0);
    expect(store.files().map((f) => f.name)).toEqual(['b.md', 'a.md']);
  });

  it('ファイル追加だけでは改ページ指定を維持する', async () => {
    await store.addFiles([file('a.md', '# A')]);
    await whenRendered();
    store.toggleBreak(store.blocks()[0].id);
    await store.addFiles([file('b.md', '# B')]);
    await whenRendered();
    expect(store.breaks().has('f0b0')).toBe(true);
  });

  it('doc の読み取りは DOM を変異させない (クラス付与は消費者の描画時に行う)', async () => {
    await store.addFiles([file('a.md', '# A\n\n本文')]);
    await whenRendered();
    store.toggleBreak(store.blocks()[1].id);
    const container = store.renderedDocument()!.container;
    expect(
      [...container.children].some((el) => el.classList.contains('forced-break')),
    ).toBe(false);
  });

  it('toggleBreak は同じ ID の追加/削除を繰り返せる', () => {
    store.toggleBreak('f0b0');
    expect(store.breaks().has('f0b0')).toBe(true);
    store.toggleBreak('f0b0');
    expect(store.breaks().has('f0b0')).toBe(false);
  });

  it('存在しない ID の removeFile では改ページ指定を消さない', async () => {
    await store.addFiles([file('a.md', '# A')]);
    await whenRendered();
    store.toggleBreak(store.blocks()[0].id);
    store.removeFile(9999);
    await whenRendered();
    expect(store.breaks().size).toBe(1);
    expect(store.files()).toHaveLength(1);
  });

});

describe('EditorStore 変換の競合', () => {
  /** mermaid の解決を 1 件ずつ手動制御する fake */
  const pending: ((svg: { svg: string }) => void)[] = [];
  class DeferredMermaidRenderer extends MermaidRenderer {
    protected override loadModule(): Promise<MermaidLike> {
      return Promise.resolve({
        initialize: () => {},
        render: () => new Promise((resolve) => pending.push(resolve)),
      });
    }
  }

  beforeEach(() => {
    pending.length = 0;
    TestBed.configureTestingModule({
      providers: [EditorStore, { provide: MermaidRenderer, useClass: DeferredMermaidRenderer }],
    });
  });

  // whenStable は保留中の loader を待ち続けるため使えない。tick + タスク flush で進める
  async function settle(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  it('遅延して解決した古い変換が、現行文書のキャッシュを追い出して壊さない', async () => {
    const store = TestBed.inject(EditorStore);
    const mermaid = '```mermaid\ngraph LR\nX-->Y\n```';

    // loader1: [A] を開始、A の mermaid が保留のまま (pending[0])
    await store.addFiles([file('a.md', `# A\n\n${mermaid}`)]);
    await settle();
    // loader2: [A, B] を開始。A 未キャッシュのため A から再変換 (pending[1])
    await store.addFiles([file('b.md', `# B\n\n${mermaid}`)]);
    await settle();
    expect(pending.length).toBe(2);
    // loader2 の A → B を順に解決し、loader2 を完走させる (A, B がキャッシュされる)
    pending[1]({ svg: '<svg>A2</svg>' });
    await settle();
    pending[2]({ svg: '<svg>B2</svg>' });
    await settle();
    // loader3: [A, B, C] を開始。A, B はキャッシュ済みで C だけ保留 (pending[3])
    await store.addFiles([file('c.md', `# C\n\n${mermaid}`)]);
    await settle();
    expect(pending.length).toBe(4);
    // 古い loader1 がいま解決する — keep={A} の追い出しで B を消してはならない
    pending[0]({ svg: '<svg>A1</svg>' });
    await settle();
    // loader3 の C を解決して完走させる
    pending[3]({ svg: '<svg>C3</svg>' });
    await settle();

    const headings = store
      .blocks()
      .filter((b) => b.kind === 'heading')
      .map((b) => b.label);
    expect(headings).toEqual(['A', 'B', 'C']);
    // B のフラグメントが追い出されていれば b.md のブロックが欠落する
    expect(store.blocks().filter((b) => b.fileName === 'b.md').length).toBeGreaterThanOrEqual(2);
  });
});
