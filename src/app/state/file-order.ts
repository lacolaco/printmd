import type { ManuscriptFile } from '../manuscript';

/** 原稿ファイル列の純粋操作。並べ替えの検証・実行と、追記だけの変化の判定を閉じる */
export class FileOrder {
  constructor(private readonly items: readonly ManuscriptFile[]) {}

  /** 自身が next の先頭部分か (要素は同一参照)。真なら「末尾への追記だけ」の変化 */
  isPrefixOf(next: readonly ManuscriptFile[]): boolean {
    const { items } = this;
    return items.length <= next.length && items.every((file, index) => next[index] === file);
  }

  reordered(from: number, to: number): readonly ManuscriptFile[] {
    return this.isMovable(from, to) ? this.spliced(from, to) : this.items;
  }

  isMovable(from: number, to: number): boolean {
    const { length } = this.items;
    return from !== to && from >= 0 && to >= 0 && from < length && to < length;
  }

  /** id のファイルを delta 方向へ動かせるか */
  isNudgeable(id: number, delta: -1 | 1): boolean {
    const index = this.items.findIndex((file) => file.id === id);
    return this.isMovable(index, index + delta);
  }

  private spliced(from: number, to: number): readonly ManuscriptFile[] {
    const next = [...this.items];
    next.splice(to, 0, ...next.splice(from, 1));
    return next;
  }
}
