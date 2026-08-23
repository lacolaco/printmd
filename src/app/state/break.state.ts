import { Service, inject, linkedSignal } from '@angular/core';
import { isPrefixOf } from '../collections';
import type { ManuscriptFile } from '../manuscript/manuscript';
import { ManuscriptState } from './manuscript.state';

/** 改ページ指定。タブ寿命のみで原稿を書き換えない */
@Service()
export class BreakState {
  private readonly manuscripts = inject(ManuscriptState);

  /**
   * ID は位置由来 (f{n}b{m}) のため、ファイルの削除・並べ替えでは同じ ID が
   * 別ブロックを指し直す。そのため構造変更でリセットする。末尾への追記だけは
   * 既存 ID が安定なので維持する。この連動を linkedSignal で宣言する
   */
  private readonly marks = linkedSignal<readonly ManuscriptFile[], ReadonlySet<string>>({
    source: this.manuscripts.files,
    computation: (files, previous) =>
      previous !== undefined && isPrefixOf(previous.source, files)
        ? previous.value
        : new Set<string>(),
  });

  readonly ids = this.marks.asReadonly();

  replace(ids: ReadonlySet<string>): void {
    this.marks.set(ids);
  }
}
