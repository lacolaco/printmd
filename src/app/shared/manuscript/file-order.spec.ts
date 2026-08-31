import { describe, expect, it } from 'vitest';
import { FileOrder } from './file-order';
import type { ManuscriptFile } from './manuscript';
import { Direction } from '../support/direction';

function file(id: number): ManuscriptFile {
  return { id, name: `${id}.md`, content: '' };
}

const items = [file(1), file(2), file(3)];

describe('FileOrder.isMovable', () => {
  it('前方かつ範囲内なら移動できる', () => {
    expect(new FileOrder(items).isMovable(0, 2)).toBe(true);
  });

  it('同じ位置への移動はできない', () => {
    expect(new FileOrder(items).isMovable(1, Direction.Forward)).toBe(false);
  });

  it('負の位置は範囲外として移動できない', () => {
    expect(new FileOrder(items).isMovable(-1, 0)).toBe(false);
  });

  it('末尾を超える位置は範囲外として移動できない', () => {
    expect(new FileOrder(items).isMovable(0, 3)).toBe(false);
  });
});

describe('FileOrder.reordered', () => {
  it('移動できる位置なら並べ替えた新しい配列を返す', () => {
    const reordered = new FileOrder(items).reordered(0, 2);
    expect(reordered.map((f) => f.id)).toEqual([2, 3, 1]);
  });

  it('移動できない操作は元の配列参照をそのまま返す', () => {
    const order = new FileOrder(items);
    expect(order.reordered(1, 1)).toBe(items);
  });
});

describe('FileOrder.isNudgeable', () => {
  it('先頭は前方向へ動かせない', () => {
    expect(new FileOrder(items).isNudgeable(1, -1)).toBe(false);
  });

  it('末尾は後方向へ動かせない', () => {
    expect(new FileOrder(items).isNudgeable(3, 1)).toBe(false);
  });

  it('中間の要素はどちらの方向にも動かせる', () => {
    const order = new FileOrder(items);
    expect(order.isNudgeable(2, -1)).toBe(true);
    expect(order.isNudgeable(2, 1)).toBe(true);
  });

  it('存在しない ID は動かせない', () => {
    expect(new FileOrder(items).isNudgeable(9999, 1)).toBe(false);
  });
});
