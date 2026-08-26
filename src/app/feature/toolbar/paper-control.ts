import { Component, model } from '@angular/core';
import { FormField, form, transformedValue } from '@angular/forms/signals';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';

/** 用紙書式の選択面。書式そのものを受け渡し、表示名との変換は境界に閉じる */
@Component({
  selector: 'app-paper-control',
  imports: [FormField],
  host: { class: 'flex items-center' },
  template: `
    <label class="flex items-center gap-1">
      <span>用紙</span>
      <select class="rounded px-1 py-0.5 hover:bg-stone-200" [formField]="field">
        @for (paper of papers; track paper.label) {
          <option>{{ paper.label }}</option>
        }
      </select>
    </label>
  `,
})
export class PaperControl {
  /** 現在の書式 */
  readonly selected = model.required<PaperFormat>();

  protected readonly papers = PAPERS;

  /** select と結ぶフィールド。native の select は文字列しか持てないので表示名を挟む */
  protected readonly field = form(
    transformedValue(this.selected, {
      parse: (label: string) => ({ value: PAPERS.find((paper) => paper.label === label) }),
      format: (paper: PaperFormat) => paper.label,
    }),
  );
}
