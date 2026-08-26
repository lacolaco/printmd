import { Component, model } from '@angular/core';
import { ToolbarWidget, ToolbarWidgetGroup } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';

/**
 * 用紙書式の選択面。帯の widget として組むため、ボタン列で表す。native の select は
 * 選択値と widget 識別子が同じ `value` を取り合い、Signal Forms の formField とも
 * 共存できない (NG8022)。
 * role は radiogroup / radio ではなく aria-pressed にする。Toolbar の矢印キーは
 * ロービング移動だけを担い選択を動かさないため、radio の約束と食い違う
 * (排他であることは ngToolbarWidgetGroup が構造で示す)。
 * ngToolbarWidgetGroup は host に role を持たず role=generic になり、generic への
 * 名前付けは ARIA 1.2 が禁じるため role="group" を足す。名前は aria-label で与え、
 * 可視の見出しは装飾として隠す (id の参照は複数描画で衝突しうる)。
 * 選択の確定も選択状態も Toolbar の value 模型には載せない。帯には選択の意味を
 * 持たないアクションの widget (ズームの段送り) も並び、帯ひとつの value 配列に
 * 両者が混ざると書式を取り出せなくなるためである
 */
@Component({
  selector: 'app-paper-control',
  imports: [ToolbarWidget, ToolbarWidgetGroup],
  host: { class: 'flex items-center gap-1' },
  template: `
    <span aria-hidden="true">用紙</span>
    <div ngToolbarWidgetGroup role="group" aria-label="用紙" class="flex">
      @for (paper of papers; track paper.label) {
        <button
          type="button"
          class="rounded px-1.5 py-0.5 hover:bg-stone-200 aria-pressed:bg-stone-700 aria-pressed:font-medium aria-pressed:text-white"
          ngToolbarWidget
          [value]="paper.label"
          [attr.aria-pressed]="paper === selected()"
          (click)="selected.set(paper)"
          (keydown)="pick(paper, $event)"
        >
          {{ paper.label }}
        </button>
      }
    </div>
  `,
})
export class PaperControl {
  /** 現在の書式 */
  readonly selected = model.required<PaperFormat>();

  protected readonly papers = PAPERS;

  /**
   * Enter / Space での選択。Toolbar は repeat の keydown までは既定動作を止めない
   * (KeyboardEventManager の既定が ignoreRepeat) ため、長押しで keydown 由来と
   * 合成 click 由来の 2 経路が走ってしまう。ここで無条件に preventDefault して
   * click の合成そのものを断ち、選択は repeat でないときだけ行う
   */
  protected pick(paper: PaperFormat, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectUnlessRepeat(paper, event.repeat);
    }
  }

  protected selectUnlessRepeat(paper: PaperFormat, repeat: boolean): void {
    if (!repeat) {
      this.selected.set(paper);
    }
  }
}
