import { Component, output, type OutputEmitterRef } from '@angular/core';
import { isNonEmpty } from '../../../../collections';
import { fromFileList } from '../../../../manuscript';

/** 追加取り込みの入力面。ファイル選択とドロップを受けて選ばれたファイルを通知する */
@Component({
  selector: 'app-file-add-input',
  template: `
    <label
      class="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-stone-300 px-2 py-1 text-xs text-stone-600 hover:border-stone-500 hover:text-stone-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
      (dragover)="permitDrag($event)"
      (drop)="acceptDrop($event)"
    >
      <input
        type="file"
        class="sr-only"
        multiple
        accept=".md,.markdown,.txt"
        (change)="readSelection($event)"
      />
      + ファイルを追加
    </label>
  `,
})
export class FileAddInput {
  readonly selected = output<readonly File[]>();

  protected permitDrag(event: DragEvent): void {
    event.preventDefault();
  }

  protected acceptDrop(event: DragEvent): void {
    event.preventDefault();
    emitSelection(this.selected, fromFileList(event.dataTransfer?.files));
  }

  protected readSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    emitSelection(this.selected, fromFileList(input.files));
    input.value = '';
  }
}

/** 空の選択は通知しない (仕様: ファイルの無いドロップは無視する) */
function emitSelection(selected: OutputEmitterRef<readonly File[]>, files: readonly File[]): void {
  if (isNonEmpty(files)) {
    selected.emit(files);
  }
}
