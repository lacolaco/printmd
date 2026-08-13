import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { EditorStore } from '../state/editor-store';

/**
 * 原稿ファイルの取り込みと並べ替え。並べ替えはドラッグとキーボード
 * (上へ/下へボタン) の両方に対応する。ファイル境界 = 強制改ページなので、
 * 順序は紙面に直結する。
 */
@Component({
  selector: 'app-file-panel',
  template: `
    <section aria-labelledby="file-panel-heading">
      <h2 id="file-panel-heading" class="mb-2 text-sm font-bold text-stone-700">原稿ファイル</h2>

      <label
        class="block cursor-pointer rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
        [class.border-blue-500]="dragOver()"
        [class.bg-blue-50]="dragOver()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <input
          type="file"
          class="sr-only"
          multiple
          accept=".md,.markdown,.txt"
          (change)="onFileInput($event)"
        />
        Markdown ファイルをドロップ、またはクリックして選択
      </label>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement() }}</p>

      @if (store.files().length > 0) {
        <ul class="mt-3 space-y-1" role="list">
          @for (file of store.files(); track file.id; let i = $index; let last = $last) {
            <li
              class="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm"
              [class.opacity-50]="draggingIndex() === i"
              draggable="true"
              (dragstart)="draggingIndex.set(i)"
              (dragend)="draggingIndex.set(null)"
              (dragover)="$event.preventDefault()"
              (drop)="onListDrop($event, i)"
            >
              <span class="cursor-grab text-stone-500" aria-hidden="true">⠿</span>
              <span class="min-w-0 flex-1 truncate" [title]="file.name">{{ file.name }}</span>
              <button
                type="button"
                class="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                [attr.aria-label]="file.name + ' を上へ移動'"
                [disabled]="i === 0"
                (click)="move(file.id, file.name, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                [attr.aria-label]="file.name + ' を下へ移動'"
                [disabled]="last"
                (click)="move(file.id, file.name, 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="rounded p-1 text-stone-500 hover:bg-red-50 hover:text-red-600"
                [attr.aria-label]="file.name + ' を取り除く'"
                (click)="store.removeFile(file.id)"
              >
                ✕
              </button>
            </li>
          }
        </ul>
        @if (store.files().length > 1) {
          <p class="mt-1 text-xs text-stone-500">ファイル境界は常に改ページになります</p>
        }
      }

      @if (store.warnings().length > 0) {
        <ul class="mt-2 space-y-1" role="list">
          @for (warning of store.warnings(); track warning) {
            <li class="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">{{ warning }}</li>
          }
        </ul>
      }
    </section>
  `,
})
export class FilePanel {
  protected readonly store = inject(EditorStore);
  protected readonly dragOver = signal(false);
  protected readonly draggingIndex = signal<number | null>(null);
  protected readonly announcement = signal('');
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length > 0) void this.store.addFiles(files);
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    if (files.length > 0) void this.store.addFiles(files);
    input.value = '';
  }

  protected onListDrop(event: DragEvent, targetIndex: number): void {
    // preventDefault しないと OS からのファイル投下でページごと遷移してしまう
    event.preventDefault();
    const from = this.draggingIndex();
    this.draggingIndex.set(null);
    if (from !== null && from !== targetIndex) {
      if (this.store.reorderFile(from, targetIndex)) {
        this.announceOrder(this.store.files()[targetIndex].name, targetIndex);
      }
    }
  }

  protected move(id: number, name: string, delta: -1 | 1): void {
    if (!this.store.moveFile(id, delta)) return;
    const index = this.store.files().findIndex((file) => file.id === id);
    this.announceOrder(name, index);
    // 移動でボタンが disabled になるとフォーカスが body へ落ちる。同じファイルの
    // 操作ボタンへ戻す (押した方向が無効なら反対方向のボタンへ)
    afterNextRender(
      () => {
        const host = this.elementRef.nativeElement;
        const preferred = host.querySelector<HTMLButtonElement>(
          `button[aria-label="${CSS.escape(name)} を${delta === -1 ? '上' : '下'}へ移動"]`,
        );
        const fallback = host.querySelector<HTMLButtonElement>(
          `button[aria-label="${CSS.escape(name)} を${delta === -1 ? '下' : '上'}へ移動"]`,
        );
        (preferred?.disabled === false ? preferred : fallback)?.focus();
      },
      { injector: this.injector },
    );
  }

  private announceOrder(name: string, index: number): void {
    this.announcement.set(
      `${name} を ${index + 1} 番目に移動しました。改ページ指定はリセットされます`,
    );
  }
}
