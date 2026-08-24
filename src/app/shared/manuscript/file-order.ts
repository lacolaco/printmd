import type { ManuscriptFile } from './manuscript';

/** 原稿ファイル列の純粋操作 */
export class FileOrder {
  constructor(private readonly items: readonly ManuscriptFile[]) {}

  reordered(from: number, to: number): readonly ManuscriptFile[] {
    return this.isMovable(from, to) ? this.spliced(from, to) : this.items;
  }

  isMovable(from: number, to: number): boolean {
    const { length } = this.items;
    return from !== to && from >= 0 && to >= 0 && from < length && to < length;
  }

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
