import { Component, inject } from '@angular/core';
import { EditorStore } from '../state/editor-store';

/**
 * 空状態の取り込み面。最初の一手 (ドロップ / クリック選択) とアプリの用途を
 * 教える唯一の場所。原稿が入ると役目を終えて消える
 */
@Component({
  selector: 'app-import-dropzone',
  template: `
    <label
      class="app-empty-drop flex h-full cursor-pointer flex-col items-center justify-center gap-3 text-sm"
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
      <span class="max-w-sm text-center">
        Markdownファイルをここへドロップ、またはクリックして選択すると、A4の紙面プレビューが表示されます
      </span>
    </label>
  `,
  host: { class: 'block h-full' },
})
export class ImportDropzone {
  private readonly store = inject(EditorStore);

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files !== null) void this.store.addFiles([...input.files]);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files !== undefined && files.length > 0) void this.store.addFiles([...files]);
  }
}
