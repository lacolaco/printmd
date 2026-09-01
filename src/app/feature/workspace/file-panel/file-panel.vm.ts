import { Injectable, inject, signal, type Signal } from '@angular/core';
import { Manuscripts } from '../../../shared/manuscript/manuscripts';
import type { Direction } from '../../../shared/support/direction';
import type { ManuscriptFile } from '../../../shared/manuscript/manuscript';
import type { ImportSource } from '../../../shared/manuscript/import-source';

/**
 * FilePanel のビューモデル。原稿一覧の query と取り込み・並べ替え・削除の command、
 * 並べ替え結果の読み上げ文 (role=status が購読) を持つ。動けない移動は無視する
 */
@Injectable()
export class FilePanelViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly notice = signal('');

  /** 取り込み済みの原稿ファイル列 (紙面の順) */
  readonly files: Signal<readonly ManuscriptFile[]> = this.manuscripts.files;
  /** 直近の取り込みで生じた警告文 */
  readonly warnings: Signal<readonly string[]> = this.manuscripts.warnings;
  /** 並べ替え結果の読み上げ文 (role=status が購読) */
  readonly message: Signal<string> = this.notice.asReadonly();

  /** 追加の取り込み入力を原稿列の末尾へ足す */
  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  /** 指定 ID の原稿を除く */
  remove(id: number): void {
    this.manuscripts.remove(id);
  }

  /** 原稿を 1 つ上/下へ動かし、読み上げ文を更新する。動けなければ何もしない */
  move(id: number, name: string, delta: Direction): void {
    if (this.manuscripts.isMovable(id, delta)) {
      this.manuscripts.nudge(id, delta);
      this.announce(
        name,
        this.files().findIndex((file) => file.id === id),
      );
    }
  }

  /** ドラッグの並べ替えを反映し、読み上げ文を更新する。位置が変わらなければ何もしない */
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
