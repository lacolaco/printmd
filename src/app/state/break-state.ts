import { Service, inject, linkedSignal } from '@angular/core';
import type { ManuscriptFile } from '../manuscript/manuscript';
import { ManuscriptState } from './manuscript-state';

/** prev が next の先頭部分か (要素は同一参照)。真なら「末尾への追記だけ」の変化 */
function isPrefixOf(prev: readonly ManuscriptFile[], next: readonly ManuscriptFile[]): boolean {
  return prev.length <= next.length && prev.every((file, index) => next[index] === file);
}

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

  readonly breaks = this.marks.asReadonly();

  replace(breaks: ReadonlySet<string>): void {
    this.marks.set(breaks);
  }
}
