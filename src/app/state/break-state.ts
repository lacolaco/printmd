import { Service, inject, linkedSignal } from '@angular/core';
import { FileOrder } from '../manuscript/file-order';
import type { ManuscriptFile } from '../manuscript/manuscript';
import { ManuscriptState } from './manuscript-state';

function isMarked(breaks: ReadonlySet<string>, blockId: string): boolean {
  return breaks.has(blockId);
}

function without(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.delete(blockId);
  return next;
}

function withAdded(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.add(blockId);
  return next;
}

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  return isMarked(current, blockId) ? without(current, blockId) : withAdded(current, blockId);
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
      previous !== undefined && new FileOrder(previous.source).isPrefixOf(files)
        ? previous.value
        : new Set<string>(),
  });

  readonly breaks = this.marks.asReadonly();

  toggleBreak(blockId: string): void {
    this.marks.update((current) => toggled(current, blockId));
  }
}
