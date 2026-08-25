import { Component, input, output } from '@angular/core';
import type { PaperFormat } from '../../shared/paper/paper-format';

/** 用紙書式の選択面。一覧と現在値を受け取り、選んだ id をイベントで返すだけ */
@Component({
  selector: 'app-paper-control',
  host: { class: 'flex items-center' },
  template: `
    <label class="flex items-center gap-1">
      <span class="sr-only">用紙サイズ</span>
      <!-- select の value は option 生成前に当たって落ちるため、選択状態は option 側で持つ -->
      <select class="rounded px-1 py-0.5 hover:bg-stone-200" (change)="pick($event)">
        @for (paper of choices(); track paper.id) {
          <option [value]="paper.id" [selected]="paper.id === current()">{{ paper.label }}</option>
        }
      </select>
    </label>
  `,
})
export class PaperControl {
  readonly choices = input<readonly PaperFormat[]>([]);
  readonly current = input('');
  readonly picked = output<string>();

  protected pick(event: Event): void {
    this.picked.emit((event.target as HTMLSelectElement).value);
  }
}
