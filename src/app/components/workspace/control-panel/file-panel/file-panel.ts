import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { EditorStore } from '../../../../state/editor-store';
import { FileAddInput } from './file-add-input';
import { FileRowItem } from './file-row-item';

/**
 * 原稿ファイルの取り込みと並べ替え。並べ替えはドラッグとキーボード
 * (上へ/下へボタン) の両方に対応する。ファイル境界 = 強制改ページなので、
 * 順序は紙面に直結する
 */
@Component({
  selector: 'app-file-panel',
  imports: [CdkDrag, CdkDropList, FileAddInput, FileRowItem],
  template: `
    <section aria-label="原稿ファイル">
      <ul class="space-y-1" role="list" cdkDropList (cdkDropListDropped)="onListDrop($event)">
        @for (file of store.files(); track file.id; let i = $index; let last = $last) {
          <li>
            <app-file-row-item
              cdkDrag
              [file]="file"
              [first]="i === 0"
              [last]="last"
              (moved)="move(file.id, file.name, $event)"
              (removed)="store.removeFile(file.id)"
            />
          </li>
        }
      </ul>
      <app-file-add-input (selected)="store.addFiles($event)" />

      @if (store.warnings().length > 0) {
        <ul class="mt-2 space-y-1" role="status">
          @for (warning of store.warnings(); track warning) {
            <li class="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">{{ warning }}</li>
          }
        </ul>
      }
      <p class="sr-only" role="status" aria-live="polite">{{ announcement() }}</p>
    </section>
  `,
})
export class FilePanel {
  protected readonly store = inject(EditorStore);
  protected readonly announcement = signal('');
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected onListDrop(event: CdkDragDrop<unknown>): void {
    if (this.store.reorderFile(event.previousIndex, event.currentIndex)) {
      this.announceOrder(this.store.files()[event.currentIndex].name, event.currentIndex);
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
          `button[data-move-file="${id}"][data-move-dir="${delta}"]`,
        );
        const fallback = host.querySelector<HTMLButtonElement>(
          `button[data-move-file="${id}"][data-move-dir="${-delta}"]`,
        );
        (preferred?.disabled === false ? preferred : fallback)?.focus();
      },
      { injector: this.injector },
    );
  }

  private announceOrder(name: string, index: number): void {
    this.announcement.set(
      `${name}を${index + 1}番目に移動しました。改ページ指定はリセットされます`,
    );
  }
}
