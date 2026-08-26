import { Component, model } from '@angular/core';
import { ToolbarWidget, ToolbarWidgetGroup } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';

/**
 * 用紙書式の選択面。native の select は `value` の意味が ngToolbarWidget と衝突し
 * (select 自身の選択値を表す value と、widget 識別用の value が同じ属性名を取り合う)
 * Signal Forms の formField とも共存できない (NG8022) ため、公式の radiogroup 構成
 * (ngToolbarWidgetGroup + ngToolbarWidget のボタン列) で表現する。
 * Toolbar は Enter / Space の既定動作 (button の click 発火) を横取りするため、
 * 選択の確定はボタン自身の keydown で直接受ける。
 * 選択状態も Toolbar の value 模型には載せない。帯には選択の意味を持たない
 * アクションの widget (ズームの段送り) も並ぶため、帯ひとつの value 配列に
 * 両者が混ざると書式の選択を取り出せなくなる
 */
@Component({
  selector: 'app-paper-control',
  imports: [ToolbarWidget, ToolbarWidgetGroup],
  host: { class: 'flex items-center gap-1' },
  template: `
    <span id="paper-control-label">用紙</span>
    <div ngToolbarWidgetGroup role="radiogroup" aria-labelledby="paper-control-label" class="flex">
      @for (paper of papers; track paper.label) {
        <button
          type="button"
          class="rounded px-1.5 py-0.5 hover:bg-stone-200 aria-checked:bg-stone-200 aria-checked:font-medium"
          ngToolbarWidget
          [value]="paper.label"
          role="radio"
          [attr.aria-checked]="paper === selected()"
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

  /** Enter / Space での選択。click には既定動作が届かないため独立に受ける */
  protected pick(paper: PaperFormat, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.selected.set(paper);
    }
  }
}
