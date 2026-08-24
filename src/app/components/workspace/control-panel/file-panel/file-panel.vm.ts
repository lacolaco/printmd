import { Injectable, inject, signal } from '@angular/core';
import { Manuscripts } from '../../../../manuscript/manuscripts';
import type { ImportSource } from '../../../../manuscript/manuscript';

/**
 * FilePanel のビューモデル。原稿一覧の問い合わせと取り込み・並べ替え・削除の命令、
 * 並べ替え結果の読み上げ文 (role=status が購読) を持つ
 */
@Injectable()
export class FilePanelViewModel {
  private readonly manuscripts = inject(Manuscripts);

  readonly files = this.manuscripts.files;
  readonly warnings = this.manuscripts.warnings;
  readonly message = signal('');

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  remove(id: number): void {
    this.manuscripts.remove(id);
  }

  isMovable(id: number, delta: -1 | 1): boolean {
    return this.manuscripts.isMovable(id, delta);
  }

  isReorderable(from: number, to: number): boolean {
    return this.manuscripts.isReorderable(from, to);
  }

  /** ファイルを 1 つ動かし、読み上げ文を更新して新しい位置を返す */
  nudge(id: number, name: string, delta: -1 | 1): number {
    this.manuscripts.nudge(id, delta);
    const index = this.files().findIndex((file) => file.id === id);
    this.message.set(`${name}を${index + 1}番目に移動しました。改ページ指定はリセットされます`);
    return index;
  }

  reorder(from: number, to: number): void {
    this.manuscripts.reorder(from, to);
    const moved = this.files()[to];
    this.message.set(`${moved.name}を${to + 1}番目に移動しました。改ページ指定はリセットされます`);
  }
}
