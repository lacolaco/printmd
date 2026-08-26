import { Service, computed, inject, linkedSignal } from '@angular/core';
import { isPrefixOf } from '../support/collections';
import { ConversionPipeline } from '../conversion-pipeline';
import { Manuscripts } from '../manuscript/manuscripts';
import { Paper } from '../paper/paper';
import { StyleVariables } from '../layout/style-variables';
import { measurePagination } from './measure-pagination';
import type { ManuscriptFile } from '../manuscript/manuscript';

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  const removed = next.delete(blockId);
  return removed ? next : next.add(blockId);
}

/**
 * ページの割れ方。改ページ指定を保有し (タブ寿命のみで原稿を書き換えない)、
 * 指定を織り込んだページ組を導く
 */
@Service()
export class Breaks {
  private readonly manuscripts = inject(Manuscripts);
  private readonly pipeline = inject(ConversionPipeline);
  private readonly paper = inject(Paper);
  private readonly style = inject(StyleVariables);

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

  /** 強制改ページに指定されたブロック ID の集合 */
  readonly ids = this.marks.asReadonly();

  /** 指定ブロックの直前で改ページするかを反転する */
  toggle(blockId: string): void {
    this.marks.set(toggled(this.ids(), blockId));
  }

  /**
   * ページ組。(doc, 指定) を現在の CSS で組んだときのレイアウト結果の
   * メモ化された導出値 (実測は画面外の領域で行うが観測可能な状態を残さない)。
   * 組み上がりを決める設定は StyleVariables が束ねるので、設定が増えても
   * ここは変わらない (寸法そのものは段の刻み計算のため書式から受け取る)
   */
  readonly pagination = computed(() => {
    this.style.all();
    const doc = this.pipeline.renderedDocument();
    return doc === null ? null : measurePagination(doc, this.ids(), this.paper.format());
  });

  /** 総ページ数 = 各セグメントの段数の和 */
  readonly pageCount = computed(() => this.pagination()?.total ?? 0);
}
