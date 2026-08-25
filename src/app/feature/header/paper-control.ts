import { Component, input, model } from '@angular/core';
import type { PaperFormat } from '../../shared/paper/paper-format';

/** 用紙書式の選択面。一覧を受け取り、選ばれた id を返すだけ */
@Component({
  selector: 'app-paper-control',
  host: { class: 'flex items-center' },
  template: `
    <label class="flex items-center gap-1">
      <span class="sr-only">用紙サイズ</span>
      <!-- select の value は option 生成前に当たって落ちるため、選択状態は option 側で持つ -->
      <select class="rounded px-1 py-0.5 hover:bg-stone-200" (change)="choose($event)">
        @for (paper of papers(); track paper.id) {
          <option [value]="paper.id" [selected]="paper.id === selected()">{{ paper.label }}</option>
        }
      </select>
    </label>
  `,
})
export class PaperControl {
  /** 選べる書式の一覧 */
  readonly papers = input<readonly PaperFormat[]>([]);
  /** 現在の書式の id */
  readonly selected = model('');

  protected choose(event: Event): void {
    this.selected.set((event.target as HTMLSelectElement).value);
  }
}
