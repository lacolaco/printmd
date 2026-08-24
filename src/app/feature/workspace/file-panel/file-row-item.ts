import { Component, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import type { ManuscriptFile } from '../../../shared/manuscript/manuscript';

/** 原稿ファイルの 1 行。ドラッグハンドル・上下移動・削除の操作面 */
@Component({
  selector: 'app-file-row-item',
  imports: [CdkDragHandle],
  host: {
    class:
      'flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm',
  },
  template: `
    <span class="cursor-grab text-stone-500" aria-hidden="true" cdkDragHandle>⠿</span>
    <span class="min-w-0 flex-1 truncate" [title]="file().name">{{ file().name }}</span>
    <button
      type="button"
      class="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
      [attr.aria-label]="file().name + 'を上へ移動'"
      [attr.data-move-file]="file().id"
      data-move-dir="-1"
      [disabled]="first()"
      (click)="moved.emit(-1)"
    >
      ↑
    </button>
    <button
      type="button"
      class="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
      [attr.aria-label]="file().name + 'を下へ移動'"
      [attr.data-move-file]="file().id"
      data-move-dir="1"
      [disabled]="last()"
      (click)="moved.emit(1)"
    >
      ↓
    </button>
    <button
      type="button"
      class="rounded p-1 text-stone-500 hover:bg-red-50 hover:text-red-600"
      [attr.aria-label]="file().name + 'を取り除く'"
      (click)="removed.emit()"
    >
      ✕
    </button>
  `,
})
export class FileRowItem {
  readonly file = input.required<ManuscriptFile>();
  readonly first = input.required<boolean>();
  readonly last = input.required<boolean>();
  readonly moved = output<-1 | 1>();
  readonly removed = output<void>();
}
