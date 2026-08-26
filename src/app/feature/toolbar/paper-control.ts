import { Component, inject, model } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
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
 * 選択の確定も選択状態も Toolbar の value 模型には載せない。帯には選択の意味を
 * 持たないアクションの widget (ズームの段送り) も並び、帯ひとつの value 配列に
 * 両者が混ざると書式を取り出せなくなるためである
 */
@Component({
  selector: 'app-paper-control',
  imports: [ToolbarWidget, ToolbarWidgetGroup],
  host: { class: 'flex items-center gap-1' },
  template: `
    <span [id]="labelId">用紙</span>
    <div ngToolbarWidgetGroup [attr.aria-labelledby]="labelId" class="flex">
      @for (paper of papers; track paper.label) {
        <button
          type="button"
          class="rounded px-1.5 py-0.5 hover:bg-stone-200 aria-pressed:bg-stone-200 aria-pressed:font-medium"
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

  /** インスタンスごとに一意な id。複数描画されても label の参照先が衝突しない */
  protected readonly labelId = inject(_IdGenerator).getId('paper-control-label-');

  /**
   * Enter / Space での選択。Toolbar が button の既定動作を止めるため click は届かない。
   * ただし長押しの repeat では止まらず click が合成されるので、repeat 中は降りる
   */
  protected pick(paper: PaperFormat, event: KeyboardEvent): void {
    if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
      this.selected.set(paper);
    }
  }
}
