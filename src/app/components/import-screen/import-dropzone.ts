import { Component, inject } from '@angular/core';
import { EditorStore } from '../../state/editor-store';

/** デモ原稿 (public/demo/ に同梱)。ガイド + 著作権消滅作品の長文 */
const DEMO_FILES = ['printmd-guide.md', 'hashire-merosu.md'];

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

  /** 同梱のデモ原稿を通常の取り込み経路で読み込む */
  protected loadDemo(event: Event): void {
    // label 内のボタンなので、既定動作 (ファイル選択ダイアログ) を抑止する
    event.preventDefault();
    void this.store.addFiles(
      DEMO_FILES.map((name) => ({
        name,
        text: async () => {
          const response = await fetch(`/demo/${name}`);
          if (!response.ok) throw new Error(`demo fetch failed: ${name}`);
          return response.text();
        },
      })),
    );
  }
}
