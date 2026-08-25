import { Injectable, inject, signal, type Signal } from '@angular/core';
import { Manuscripts } from '../../../shared/manuscript/manuscripts';
import type { ImportSource, ManuscriptFile } from '../../../shared/manuscript/manuscript';

/**
 * FilePanel のビューモデル。原稿一覧の query と取り込み・並べ替え・削除の command、
 * 並べ替え結果の読み上げ文 (role=status が購読) を持つ。動けない移動は無視する
 */
@Injectable()
export class FilePanelViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly notice = signal('');

  readonly files: Signal<readonly ManuscriptFile[]> = this.manuscripts.files;
  readonly warnings: Signal<readonly string[]> = this.manuscripts.warnings;
  readonly message: Signal<string> = this.notice.asReadonly();

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  remove(id: number): void {
    this.manuscripts.remove(id);
  }

  move(id: number, name: string, delta: -1 | 1): void {
    if (this.manuscripts.isMovable(id, delta)) {
      this.manuscripts.nudge(id, delta);
      this.announce(
        name,
        this.files().findIndex((file) => file.id === id),
      );
    }
  }

  reorder(from: number, to: number): void {
    if (this.manuscripts.isReorderable(from, to)) {
      this.manuscripts.reorder(from, to);
      this.announce(this.files()[to].name, to);
    }
  }

  private announce(name: string, index: number): void {
    this.notice.set(`${name}を${index + 1}番目に移動しました。改ページ指定はリセットされます`);
  }
}
