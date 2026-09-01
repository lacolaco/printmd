import { Component, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Direction } from '../../../shared/support/direction';
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
      [attr.data-move-dir]="backward"
      [disabled]="isFirst()"
      (click)="moved.emit(backward)"
    >
      ↑
    </button>
    <button
      type="button"
      class="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
      [attr.aria-label]="file().name + 'を下へ移動'"
      [attr.data-move-file]="file().id"
      [attr.data-move-dir]="forward"
      [disabled]="isLast()"
      (click)="moved.emit(forward)"
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
  protected readonly backward = Direction.Backward;
  protected readonly forward = Direction.Forward;
  readonly file = input.required<ManuscriptFile>();
  readonly isFirst = input.required<boolean>();
  readonly isLast = input.required<boolean>();
  readonly moved = output<Direction>();
  readonly removed = output<void>();
}
