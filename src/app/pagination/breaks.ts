import { Service, inject, linkedSignal } from '@angular/core';
import { isPrefixOf } from '../collections';
import { Manuscripts } from '../manuscript/manuscripts';
import type { ManuscriptFile } from '../manuscript/manuscript';

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  const removed = next.delete(blockId);
  return removed ? next : next.add(blockId);
}

/** 改ページ指定。指定の保有とトグルを担う。タブ寿命のみで原稿を書き換えない */
@Service()
export class Breaks {
  private readonly manuscripts = inject(Manuscripts);

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

  toggle(blockId: string): void {
    this.marks.set(toggled(this.ids(), blockId));
  }
}
