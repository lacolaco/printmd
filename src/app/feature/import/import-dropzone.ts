import { Component, inject } from '@angular/core';
import { sourcesFrom } from '../../shared/manuscript/manuscript';
import { ImportDropzoneViewModel } from './import-dropzone.vm';

/**
 * 空状態の取り込み面。最初の一手 (ドロップ / クリック選択) とアプリの用途を
 * 教える唯一の場所。原稿が入ると役目を終えて消える
 */
@Component({
  selector: 'app-import-dropzone',
  providers: [ImportDropzoneViewModel],
  template: `
    <label
      class="app-empty-drop flex h-full cursor-pointer flex-col items-center justify-center gap-3 text-sm"
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
      <span class="max-w-sm text-center">
        Markdownファイルをここへドロップ、またはクリックして選択すると、紙面プレビューが表示されます
      </span>
      <button
        type="button"
        class="rounded-md border border-stone-400 px-3 py-1.5 text-xs text-stone-700 hover:border-stone-600 hover:bg-white"
        (click)="loadDemo($event)"
      >
        サンプル原稿で試す
      </button>
    </label>
  `,
  host: { class: 'block h-full' },
})
export class ImportDropzone {
  protected readonly vm = inject(ImportDropzoneViewModel);

  protected readSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.vm.add(sourcesFrom(input.files));
    input.value = '';
  }

  protected permitDrag(event: DragEvent): void {
    event.preventDefault();
  }

  protected acceptDrop(event: DragEvent): void {
    event.preventDefault();
    this.vm.add(sourcesFrom(event.dataTransfer?.files));
  }

  protected loadDemo(event: Event): void {
    // label 内のボタンなので、既定動作 (ファイル選択ダイアログ) を抑止する
    event.preventDefault();
    this.vm.loadDemo();
  }
}
