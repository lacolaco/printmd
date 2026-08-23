import { Component, output } from '@angular/core';
import { hasItems } from '../../../../collections';

/** 追加取り込みの入力面。ファイル選択とドロップを受けて選ばれたファイルを通知する */
@Component({
  selector: 'app-file-add-input',
  template: `
    <label
      class="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-stone-300 px-2 py-1 text-xs text-stone-600 hover:border-stone-500 hover:text-stone-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
    >
      <input
        type="file"
        class="sr-only"
        multiple
        accept=".md,.markdown,.txt"
        (change)="onFileInput($event)"
      />
      + ファイルを追加
    </label>
  `,
})
export class FileAddInput {
  readonly selected = output<readonly File[]>();

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.emitIfSelected([...(event.dataTransfer?.files ?? [])]);
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitIfSelected([...(input.files ?? [])]);
    input.value = '';
  }

  private emitIfSelected(files: readonly File[]): void {
    if (hasItems(files)) this.selected.emit(files);
  }
}
